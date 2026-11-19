-- Daily health values: one row per user x date x metric x source, values within each metric's range,
-- private to each user, and the app (authenticated) can write only manual rows
begin;
select plan(47);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000d1', 'health-a@example.com'),
  ('00000000-0000-4000-8000-0000000000d2', 'health-b@example.com');

-- A's automatic rows, written as the table owner (bypassing RLS) in place of the import function
insert into health_daily_values (user_id, date, metric, source, value, updated_at) values
  ('00000000-0000-4000-8000-0000000000d1', '2026-11-18', 'weight_kg', 'withings', 82.4, '2026-01-01T00:00:00Z'),
  ('00000000-0000-4000-8000-0000000000d1', '2026-11-18', 'steps', 'apple_health', 8214, '2026-01-01T00:00:00Z');

-- Structure
select ok(
  (select relrowsecurity from pg_class where oid = 'public.health_daily_values'::regclass),
  'health_daily_values has RLS enabled'
);
select ok(
  not has_table_privilege('anon', 'public.health_daily_values',
    'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'),
  'anon has no privilege on health_daily_values'
);
select ok(
  has_table_privilege('authenticated', 'public.health_daily_values', 'SELECT')
    and has_table_privilege('authenticated', 'public.health_daily_values', 'INSERT')
    and has_table_privilege('authenticated', 'public.health_daily_values', 'UPDATE')
    and has_table_privilege('authenticated', 'public.health_daily_values', 'DELETE'),
  'authenticated can select, insert, update and delete'
);
select ok(
  not has_table_privilege('authenticated', 'public.health_daily_values', 'TRUNCATE, REFERENCES, TRIGGER'),
  'authenticated has no other privilege'
);
select col_is_unique(
  'public', 'health_daily_values', array['user_id', 'date', 'metric', 'source'],
  'user_id, date, metric and source are unique together'
);
select has_index(
  'public', 'health_daily_values', 'health_daily_values_user_id_date_idx', array['user_id', 'date'],
  'health_daily_values has an index on (user_id, date)'
);
select has_trigger(
  'public', 'health_daily_values', 'set_health_daily_values_updated_at',
  'health_daily_values has the updated_at trigger'
);

-- Uniqueness of automatic rows (as the owner, like the import function)
select throws_ok(
  $$ insert into health_daily_values (user_id, date, metric, source, value)
     values ('00000000-0000-4000-8000-0000000000d1', '2026-11-18', 'weight_kg', 'withings', 82.0) $$,
  '23505',
  null,
  'a second withings weight for the same day is refused'
);
select lives_ok(
  $$ insert into health_daily_values (user_id, date, metric, source, value)
     values ('00000000-0000-4000-8000-0000000000d1', '2026-11-18', 'weight_kg', 'withings', 82.1)
     on conflict (user_id, date, metric, source) do update set value = excluded.value, imported_at = now() $$,
  'sending the same day again upserts on the unique key'
);
select is(
  (select array_agg(value) from health_daily_values
   where user_id = '00000000-0000-4000-8000-0000000000d1' and date = '2026-11-18'
     and metric = 'weight_kg' and source = 'withings'),
  array[82.1]::numeric[],
  'the upsert leaves one row with the new value'
);
select throws_ok(
  $$ insert into health_daily_values (user_id, date, metric, source, value)
     values ('00000000-0000-4000-8000-0000000000d1', '2026-11-18', 'weight_kg', 'fitbit', 82.0) $$,
  '23514',
  null,
  'an unknown source is refused'
);

-- As user A
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000d1","role":"authenticated"}', true);

select lives_ok(
  $$ insert into health_daily_values (date, metric, source, value) values ('2026-11-19', 'weight_kg', 'manual', 70.5) $$,
  'A can add a manual weight'
);
select is(
  (select user_id from health_daily_values where date = '2026-11-19' and metric = 'weight_kg' and source = 'manual'),
  '00000000-0000-4000-8000-0000000000d1'::uuid,
  'a row added without user_id belongs to A'
);
select throws_ok(
  $$ insert into health_daily_values (date, metric, source, value) values ('2026-11-19', 'weight_kg', 'manual', 70.4) $$,
  '23505',
  null,
  'a second manual weight for the same day is refused'
);
select lives_ok(
  $$ insert into health_daily_values (date, metric, source, value) values ('2026-11-19', 'weight_kg', 'manual', 70.6)
     on conflict (user_id, date, metric, source) do update set value = excluded.value $$,
  'A can upsert the manual weight of the same day'
);
select is(
  (select array_agg(value) from health_daily_values
   where date = '2026-11-19' and metric = 'weight_kg' and source = 'manual'),
  array[70.6]::numeric[],
  'the manual upsert leaves one row with the new value'
);

-- Ranges
select throws_ok(
  $$ insert into health_daily_values (date, metric, source, value) values ('2026-11-20', 'weight_kg', 'manual', 19.99) $$,
  '23514', null, 'a weight below 20 kg is refused'
);
select throws_ok(
  $$ insert into health_daily_values (date, metric, source, value) values ('2026-11-20', 'weight_kg', 'manual', 300.01) $$,
  '23514', null, 'a weight above 300 kg is refused'
);
select throws_ok(
  $$ insert into health_daily_values (date, metric, source, value) values ('2026-11-20', 'body_fat_pct', 'manual', 0.9) $$,
  '23514', null, 'a body fat below 1% is refused'
);
select throws_ok(
  $$ insert into health_daily_values (date, metric, source, value) values ('2026-11-20', 'body_fat_pct', 'manual', 75.1) $$,
  '23514', null, 'a body fat above 75% is refused'
);
select throws_ok(
  $$ insert into health_daily_values (date, metric, source, value) values ('2026-11-20', 'steps', 'manual', -1) $$,
  '23514', null, 'negative steps are refused'
);
select throws_ok(
  $$ insert into health_daily_values (date, metric, source, value) values ('2026-11-20', 'steps', 'manual', 200001) $$,
  '23514', null, 'steps above 200000 are refused'
);
select throws_ok(
  $$ insert into health_daily_values (date, metric, source, value) values ('2026-11-20', 'active_energy_kcal', 'manual', -1) $$,
  '23514', null, 'negative active energy is refused'
);
select throws_ok(
  $$ insert into health_daily_values (date, metric, source, value) values ('2026-11-20', 'active_energy_kcal', 'manual', 10000.1) $$,
  '23514', null, 'active energy above 10000 kcal is refused'
);
select throws_ok(
  $$ insert into health_daily_values (date, metric, source, value) values ('2026-11-20', 'height_cm', 'manual', 170) $$,
  '23514', null, 'an unknown metric is refused'
);
select lives_ok(
  $$ insert into health_daily_values (date, metric, source, value) values
       ('2026-11-01', 'weight_kg', 'manual', 20),
       ('2026-11-02', 'weight_kg', 'manual', 300),
       ('2026-11-01', 'body_fat_pct', 'manual', 1),
       ('2026-11-02', 'body_fat_pct', 'manual', 75),
       ('2026-11-01', 'steps', 'manual', 0),
       ('2026-11-02', 'steps', 'manual', 200000),
       ('2026-11-01', 'active_energy_kcal', 'manual', 0),
       ('2026-11-02', 'active_energy_kcal', 'manual', 10000) $$,
  'the bounds of every range are accepted'
);

-- Sources the app may not write
select throws_ok(
  $$ insert into health_daily_values (date, metric, source, value) values ('2026-11-19', 'weight_kg', 'withings', 70.5) $$,
  '42501', null, 'A cannot add a withings row'
);
select throws_ok(
  $$ insert into health_daily_values (date, metric, source, value) values ('2026-11-19', 'steps', 'apple_health', 5000) $$,
  '42501', null, 'A cannot add an apple_health row'
);
select throws_ok(
  $$ update health_daily_values set source = 'withings'
     where date = '2026-11-19' and metric = 'weight_kg' and source = 'manual' $$,
  '42501', null, 'A cannot turn a manual row into a withings row'
);
select is(
  (select count(*) from health_daily_values where source in ('withings', 'apple_health')),
  2::bigint,
  'A sees their own automatic rows'
);
update health_daily_values set value = 60
where date = '2026-11-18' and metric = 'weight_kg' and source = 'withings';
select is(
  (select value from health_daily_values where date = '2026-11-18' and metric = 'weight_kg' and source = 'withings'),
  82.1::numeric,
  'A''s update of their own withings row changes nothing'
);
select lives_ok(
  $$ delete from health_daily_values where date = '2026-11-18' and metric = 'steps' and source = 'apple_health' $$,
  'A can delete their own automatic row'
);
select is(
  (select count(*) from health_daily_values where source = 'apple_health'),
  0::bigint,
  'A''s apple_health row is gone'
);

-- updated_at
insert into health_daily_values (date, metric, source, value, updated_at)
values ('2026-11-10', 'active_energy_kcal', 'manual', 300, '2026-01-01T00:00:00Z');
update health_daily_values set value = 310
where date = '2026-11-10' and metric = 'active_energy_kcal' and source = 'manual';
select is(
  (select updated_at from health_daily_values where date = '2026-11-10' and metric = 'active_energy_kcal' and source = 'manual'),
  now(),
  'updating a row sets updated_at'
);

-- As user B
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000d2","role":"authenticated"}', true);

select is_empty(
  $$ select id from health_daily_values where user_id = '00000000-0000-4000-8000-0000000000d1' $$,
  'B cannot see A''s rows'
);
select is(
  (select count(*) from health_daily_values),
  0::bigint,
  'B sees no rows at all'
);
update health_daily_values set value = 99 where user_id = '00000000-0000-4000-8000-0000000000d1';
delete from health_daily_values where user_id = '00000000-0000-4000-8000-0000000000d1';
select throws_ok(
  $$ insert into health_daily_values (user_id, date, metric, source, value)
     values ('00000000-0000-4000-8000-0000000000d1', '2026-11-21', 'weight_kg', 'manual', 70) $$,
  '42501', null, 'B cannot add a row as A'
);
select lives_ok(
  $$ insert into health_daily_values (date, metric, source, value) values ('2026-11-19', 'weight_kg', 'manual', 65) $$,
  'B can add their own manual weight for a day A also has'
);
select throws_ok(
  $$ insert into health_daily_values (date, metric, source, value) values ('2026-11-19', 'weight_kg', 'withings', 65) $$,
  '42501', null, 'B cannot add a withings row either'
);

-- As anon
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok(
  $$ select id from health_daily_values $$,
  '42501', null, 'anon cannot read any row'
);
select throws_ok(
  $$ insert into health_daily_values (user_id, date, metric, source, value)
     values ('00000000-0000-4000-8000-0000000000d1', '2026-11-21', 'weight_kg', 'manual', 70) $$,
  '42501', null, 'anon cannot add a row'
);
select throws_ok(
  $$ update health_daily_values set value = 99 $$,
  '42501', null, 'anon cannot update rows'
);
select throws_ok(
  $$ delete from health_daily_values $$,
  '42501', null, 'anon cannot delete rows'
);

-- Back as the owner: B's update and delete did not touch A's rows
reset role;

select is(
  (select value from health_daily_values
   where user_id = '00000000-0000-4000-8000-0000000000d1' and date = '2026-11-19'
     and metric = 'weight_kg' and source = 'manual'),
  70.6::numeric,
  'B could not update A''s manual row'
);
select is(
  (select value from health_daily_values
   where user_id = '00000000-0000-4000-8000-0000000000d1' and date = '2026-11-18'
     and metric = 'weight_kg' and source = 'withings'),
  82.1::numeric,
  'B could not update A''s withings row'
);
select is(
  (select count(*) from health_daily_values where user_id = '00000000-0000-4000-8000-0000000000d1'),
  11::bigint,
  'B could not delete A''s rows'
);
select is(
  (select count(*) from health_daily_values where user_id = '00000000-0000-4000-8000-0000000000d2'),
  1::bigint,
  'B''s own row is kept apart from A''s'
);

select * from finish();
rollback;
