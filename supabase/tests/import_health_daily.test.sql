-- The health import function: only a valid token with health:write writes, it writes only the token owner's
-- rows from the automatic sources, sending the same values again changes nothing, a changed value overwrites,
-- manual rows and other users' rows stay as they are, and one wrong record means nothing is written
begin;
select plan(73);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'import-a@example.com'),
  ('00000000-0000-4000-8000-0000000000a2', 'import-b@example.com');

-- Tokens, written as the table owner. A: valid, revoked, without the scope. B: valid
insert into import_tokens (id, user_id, label, token_hash, token_prefix, scopes, revoked_at) values
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a1', 'A valid',
   encode(sha256(convert_to('token-a-valid', 'UTF8')), 'hex'), 'mlg_aval', '{health:write}', null),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000a1', 'A revoked',
   encode(sha256(convert_to('token-a-revoked', 'UTF8')), 'hex'), 'mlg_arev', '{health:write}', '2026-11-19T00:00:00Z'),
  ('00000000-0000-4000-8000-0000000000b3', '00000000-0000-4000-8000-0000000000a1', 'A no scope',
   encode(sha256(convert_to('token-a-noscope', 'UTF8')), 'hex'), 'mlg_anos', '{food_masters:write}', null),
  ('00000000-0000-4000-8000-0000000000b4', '00000000-0000-4000-8000-0000000000a2', 'B valid',
   encode(sha256(convert_to('token-b-valid', 'UTF8')), 'hex'), 'mlg_bval', '{health:write}', null);

-- Rows already there: A's manual weight, A's withings weight on another day, B's withings weight
insert into health_daily_values (id, user_id, date, metric, source, value) values
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000a1', '2026-11-18', 'weight_kg', 'manual', 70),
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000a1', '2026-11-17', 'weight_kg', 'withings', 80),
  ('00000000-0000-4000-8000-0000000000c3', '00000000-0000-4000-8000-0000000000a2', '2026-11-18', 'weight_kg', 'withings', 90);

-- Structure
select has_function('public', 'import_health_daily', array['text', 'jsonb'], 'import_health_daily(text, jsonb) exists');
select function_returns('public', 'import_health_daily', array['text', 'jsonb'], 'jsonb', 'it returns jsonb');
select is_definer('public', 'import_health_daily', array['text', 'jsonb'], 'it is SECURITY DEFINER');
select is(
  (select proconfig from pg_proc where oid = 'public.import_health_daily(text, jsonb)'::regprocedure),
  array['search_path=""']::text[],
  'its search_path is empty'
);
select ok(
  has_function_privilege('anon', 'public.import_health_daily(text, jsonb)', 'EXECUTE')
    and has_function_privilege('authenticated', 'public.import_health_daily(text, jsonb)', 'EXECUTE'),
  'anon and authenticated can call it'
);
select ok(
  not exists (
    select 1
    from aclexplode((select proacl from pg_proc where oid = 'public.import_health_daily(text, jsonb)'::regprocedure))
    where grantee = 0
  ),
  'PUBLIC cannot call it'
);

-- The import route calls it as anon
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

-- Tokens that do not pass write nothing and say only unauthorized
select is(
  import_health_daily('token-unknown', '[{"date":"2026-11-18","source":"withings","metrics":{"weight_kg":82.4}}]'),
  '{"ok":false,"error":"unauthorized"}'::jsonb,
  'an unknown token is unauthorized'
);
select is(
  import_health_daily('token-a-revoked', '[{"date":"2026-11-18","source":"withings","metrics":{"weight_kg":82.4}}]'),
  '{"ok":false,"error":"unauthorized"}'::jsonb,
  'a revoked token is unauthorized'
);
select is(
  import_health_daily('token-a-noscope', '[{"date":"2026-11-18","source":"withings","metrics":{"weight_kg":82.4}}]'),
  '{"ok":false,"error":"unauthorized"}'::jsonb,
  'a token without health:write is unauthorized'
);
select is(
  import_health_daily(null, '[{"date":"2026-11-18","source":"withings","metrics":{"weight_kg":82.4}}]'),
  '{"ok":false,"error":"unauthorized"}'::jsonb,
  'no token is unauthorized'
);
select is(
  import_health_daily('', '[{"date":"2026-11-18","source":"withings","metrics":{"weight_kg":82.4}}]'),
  '{"ok":false,"error":"unauthorized"}'::jsonb,
  'an empty token is unauthorized'
);
select is(
  import_health_daily(encode(sha256(convert_to('token-a-valid', 'UTF8')), 'hex'),
    '[{"date":"2026-11-18","source":"withings","metrics":{"weight_kg":82.4}}]'),
  '{"ok":false,"error":"unauthorized"}'::jsonb,
  'the hash of a valid token is not a token'
);
select is(
  import_health_daily('token-unknown', '"not records"'),
  '{"ok":false,"error":"unauthorized"}'::jsonb,
  'the token is checked before the records, so wrong records with a bad token are also just unauthorized'
);

reset role;
select is(
  (select count(*) from health_daily_values),
  3::bigint,
  'nothing was written by tokens that did not pass'
);
select ok(
  (select bool_and(last_used_at is null) from import_tokens),
  'tokens that did not pass do not get last_used_at'
);

-- A valid token writes the owner's rows
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(
  import_health_daily('token-a-valid', '[
    {"date":"2026-11-18","source":"withings","metrics":{"weight_kg":82.4,"body_fat_pct":21.3},"measured_at":"2026-11-18T07:02:00+09:00"},
    {"date":"2026-11-18","source":"apple_health","metrics":{"steps":8214,"active_energy_kcal":412}}
  ]'),
  '{"ok":true,"received":4,"changed":4}'::jsonb,
  'a valid token writes 4 new values'
);

reset role;
select is(
  (select count(*) from health_daily_values where user_id = '00000000-0000-4000-8000-0000000000a1'),
  6::bigint,
  'A has the 4 new rows besides the 2 that were there'
);
select is(
  (select value from health_daily_values
   where user_id = '00000000-0000-4000-8000-0000000000a1' and date = '2026-11-18' and metric = 'weight_kg' and source = 'withings'),
  82.4::numeric,
  'the weight is saved as A''s withings row'
);
select is(
  (select measured_at from health_daily_values
   where user_id = '00000000-0000-4000-8000-0000000000a1' and date = '2026-11-18' and metric = 'weight_kg' and source = 'withings'),
  '2026-11-17T22:02:00Z'::timestamptz,
  'measured_at is saved'
);
select is(
  (select value from health_daily_values
   where user_id = '00000000-0000-4000-8000-0000000000a1' and date = '2026-11-18' and metric = 'body_fat_pct' and source = 'withings'),
  21.3::numeric,
  'the body fat is saved'
);
select is(
  (select value from health_daily_values
   where user_id = '00000000-0000-4000-8000-0000000000a1' and date = '2026-11-18' and metric = 'steps' and source = 'apple_health'),
  8214::numeric,
  'the steps are saved as A''s apple_health row'
);
select ok(
  (select measured_at is null from health_daily_values
   where user_id = '00000000-0000-4000-8000-0000000000a1' and date = '2026-11-18' and metric = 'steps' and source = 'apple_health'),
  'a record without measured_at has none'
);
select ok(
  (select last_used_at is not null from import_tokens where id = '00000000-0000-4000-8000-0000000000b1'),
  'the valid token gets last_used_at'
);
select ok(
  (select bool_and(last_used_at is null) from import_tokens where id <> '00000000-0000-4000-8000-0000000000b1'),
  'other tokens do not'
);

-- Sending again
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(
  import_health_daily('token-a-valid', '[
    {"date":"2026-11-18","source":"withings","metrics":{"weight_kg":82.40,"body_fat_pct":21.3},"measured_at":"2026-11-18T07:02:00+09:00"},
    {"date":"2026-11-18","source":"apple_health","metrics":{"steps":8214,"active_energy_kcal":412}}
  ]'),
  '{"ok":true,"received":4,"changed":0}'::jsonb,
  'sending the same values again changes nothing'
);
select is(
  import_health_daily('token-a-valid', '[
    {"date":"2026-11-18","source":"withings","metrics":{"weight_kg":82.6},"measured_at":"2026-11-18T07:02:00+09:00"},
    {"date":"2026-11-17","source":"withings","metrics":{"weight_kg":79.5}}
  ]'),
  '{"ok":true,"received":2,"changed":2}'::jsonb,
  'changed values are counted'
);
select is(
  import_health_daily('token-a-valid', '[
    {"date":"2026-11-18","source":"withings","metrics":{"weight_kg":82.6},"measured_at":"2026-11-18T07:30:00+09:00"}
  ]'),
  '{"ok":true,"received":1,"changed":1}'::jsonb,
  'a changed measured_at alone also counts as changed'
);

reset role;
select is(
  (select value from health_daily_values
   where user_id = '00000000-0000-4000-8000-0000000000a1' and date = '2026-11-18' and metric = 'weight_kg' and source = 'withings'),
  82.6::numeric,
  'the changed weight overwrote the imported one'
);
select is(
  (select measured_at from health_daily_values
   where user_id = '00000000-0000-4000-8000-0000000000a1' and date = '2026-11-18' and metric = 'weight_kg' and source = 'withings'),
  '2026-11-17T22:30:00Z'::timestamptz,
  'and measured_at was overwritten'
);
select is(
  (select value from health_daily_values where id = '00000000-0000-4000-8000-0000000000c2'),
  79.5::numeric,
  'the withings row that was there before was overwritten in place'
);
select is(
  (select count(*) from health_daily_values where user_id = '00000000-0000-4000-8000-0000000000a1'),
  6::bigint,
  'sending again added no rows'
);

-- Manual rows and other users' rows stay
select is(
  (select value from health_daily_values where id = '00000000-0000-4000-8000-0000000000c1'),
  70::numeric,
  'A''s manual weight on the same day is unchanged'
);
select is(
  (select source from health_daily_values where id = '00000000-0000-4000-8000-0000000000c1'),
  'manual',
  'and is still manual'
);
select is(
  (select value from health_daily_values where id = '00000000-0000-4000-8000-0000000000c3'),
  90::numeric,
  'B''s weight on the same day is unchanged'
);
select is(
  (select count(*) from health_daily_values where user_id = '00000000-0000-4000-8000-0000000000a2'),
  1::bigint,
  'B got no rows from A''s token'
);

-- The token, not the session, decides whose rows are written: B signed in with A's token writes A's rows
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);

select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-16","source":"withings","metrics":{"weight_kg":81}}]'),
  '{"ok":true,"received":1,"changed":1}'::jsonb,
  'a signed-in caller can call it too'
);

reset role;
select is(
  (select user_id from health_daily_values where date = '2026-11-16'),
  '00000000-0000-4000-8000-0000000000a1'::uuid,
  'the row belongs to the token owner, not to the signed-in caller'
);

-- Rounding and limits that are allowed
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-15","source":"apple_health","metrics":{"active_energy_kcal":412.6,"steps":0}},
                                          {"date":"2026-11-15","source":"withings","metrics":{"weight_kg":20,"body_fat_pct":75},"measured_at":null}]'),
  '{"ok":true,"received":4,"changed":4}'::jsonb,
  'values at the edges of the ranges and a null measured_at are allowed'
);
select is(
  import_health_daily('token-a-valid', jsonb_build_array(jsonb_build_object(
    'date', ((now() at time zone 'Asia/Tokyo')::date)::text, 'source', 'apple_health', 'metrics', jsonb_build_object('steps', 100)))),
  '{"ok":true,"received":1,"changed":1}'::jsonb,
  'today in Japan is allowed'
);
select is(
  import_health_daily('token-b-valid', (
    select jsonb_agg(jsonb_build_object(
      'date', ('2026-11-18'::date - n)::text, 'source', 'apple_health', 'metrics', jsonb_build_object('steps', n)))
    from generate_series(0, 99) as n
  )),
  '{"ok":true,"received":100,"changed":100}'::jsonb,
  '100 records at once are allowed'
);

reset role;
select is(
  (select value from health_daily_values
   where user_id = '00000000-0000-4000-8000-0000000000a1' and date = '2026-11-15' and metric = 'active_energy_kcal'),
  413::numeric,
  'active_energy_kcal is rounded to a whole number'
);
select is(
  (select count(*) from health_daily_values where user_id = '00000000-0000-4000-8000-0000000000a2'),
  101::bigint,
  'B''s token wrote B''s 100 rows'
);

-- One wrong record means nothing is written. Count A's rows before and after
create temporary table rows_before as
  select id, value, measured_at, imported_at from health_daily_values;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(
  import_health_daily('token-a-valid', '[
    {"date":"2026-11-10","source":"withings","metrics":{"weight_kg":81}},
    {"date":"2026-11-11","source":"withings","metrics":{"weight_kg":500}}
  ]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'a weight out of range next to a good record is refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","source":"withings","metrics":{"weight_kg":19.99}}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'a weight under 20 is refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","source":"withings","metrics":{"weight_kg":82.123}}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'a weight with 3 decimals is refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","source":"withings","metrics":{"body_fat_pct":21.35}}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'a body fat with 2 decimals is refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","source":"withings","metrics":{"body_fat_pct":75.1}}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'a body fat over 75 is refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","source":"apple_health","metrics":{"steps":100.5}}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'steps that are not a whole number are refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","source":"apple_health","metrics":{"steps":-1}}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'negative steps are refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","source":"apple_health","metrics":{"steps":200001}}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'steps over 200000 are refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","source":"apple_health","metrics":{"active_energy_kcal":10000.5}}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'active energy over 10000 is refused before rounding'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","source":"apple_health","metrics":{"heart_rate":60}}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'an unknown metric is refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","source":"withings","metrics":{"weight_kg":"82.4"}}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'a value that is not a number is refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","source":"withings","metrics":{}}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'a record without metrics is refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","source":"manual","metrics":{"weight_kg":81}}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'the manual source is refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","source":"fitbit","metrics":{"weight_kg":81}}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'an unknown source is refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","metrics":{"weight_kg":81}}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'a record without a source is refused'
);
select is(
  import_health_daily('token-a-valid', jsonb_build_array(jsonb_build_object(
    'date', ((now() at time zone 'Asia/Tokyo')::date + 1)::text, 'source', 'apple_health', 'metrics', jsonb_build_object('steps', 100)))),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'tomorrow in Japan is refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026/11/10","source":"withings","metrics":{"weight_kg":81}}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'a date not in YYYY-MM-DD is refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-02-30","source":"withings","metrics":{"weight_kg":81}}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'a date that does not exist is refused'
);
select is(
  import_health_daily('token-a-valid', '[{"source":"withings","metrics":{"weight_kg":81}}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'a record without a date is refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","source":"withings","metrics":{"weight_kg":81},"measured_at":"now"}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'a measured_at that is a word is refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","source":"withings","metrics":{"weight_kg":81},"measured_at":"2026-11-10T07:00:00"}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'a measured_at without a zone is refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","source":"withings","metrics":{"weight_kg":81},"measured_at":"2026-11-10T25:00:00Z"}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'a measured_at that is not a real time is refused'
);
select is(
  import_health_daily('token-a-valid', '[{"date":"2026-11-10","source":"withings","metrics":{"weight_kg":81},"user_id":"00000000-0000-4000-8000-0000000000a2"}]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'an unknown key in a record (such as user_id) is refused'
);
select is(
  import_health_daily('token-a-valid', '[
    {"date":"2026-11-10","source":"withings","metrics":{"weight_kg":81}},
    {"date":"2026-11-10","source":"withings","metrics":{"weight_kg":82}}
  ]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'the same date, source and metric twice is refused'
);
select is(
  import_health_daily('token-a-valid', '[]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'no records is refused'
);
select is(
  import_health_daily('token-a-valid', (
    select jsonb_agg(jsonb_build_object(
      'date', ('2026-11-18'::date - n)::text, 'source', 'withings', 'metrics', jsonb_build_object('weight_kg', 81)))
    from generate_series(0, 100) as n
  )),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  '101 records are refused'
);
select is(
  import_health_daily('token-a-valid', '{"date":"2026-11-10","source":"withings","metrics":{"weight_kg":81}}'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'records that are not an array are refused'
);
select is(
  import_health_daily('token-a-valid', '["2026-11-10"]'),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'a record that is not an object is refused'
);
select is(
  import_health_daily('token-a-valid', null),
  '{"ok":false,"error":"invalid_records"}'::jsonb,
  'null records are refused'
);

reset role;
select is(
  (select count(*) from health_daily_values),
  (select count(*) from rows_before),
  'no refused call added a row'
);
select is(
  (select count(*) from health_daily_values h join rows_before b using (id)
   where h.value is distinct from b.value or h.measured_at is distinct from b.measured_at or h.imported_at is distinct from b.imported_at),
  0::bigint,
  'and no refused call changed a row'
);

select * from finish();
rollback;
