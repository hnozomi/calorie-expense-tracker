-- sync_meals_to_plans: replaces the plans of every slot in the range that has meal records,
-- leaves slots without records alone, and only touches the caller's own rows
begin;
select plan(11);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'user-a@example.com'),
  ('00000000-0000-4000-8000-000000000002', 'user-b@example.com');

-- User B's plan and record in the same slot as A's day 1
insert into meal_plans (user_id, date, meal_type, planned_name, calories, protein, fat, carbs, estimated_cost)
values ('00000000-0000-4000-8000-000000000002', '2026-07-01', 'dinner', 'Bのハンバーグ', 700, 30, 30, 50, 800);
insert into meals (id, user_id, date, meal_type)
values ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-000000000002', '2026-07-01', 'dinner');
insert into meal_items (meal_id, name, calories, protein, fat, carbs, cost, sort_order)
values ('00000000-0000-4000-8000-0000000000b1', 'Bの定食', 900, 30, 30, 100, 1000, 0);

-- As user A
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

-- Day 1: planned "カレー" but actually ate "ラーメン" + "餃子"
insert into meal_plans (user_id, date, meal_type, planned_name, calories, protein, fat, carbs, estimated_cost)
values ('00000000-0000-4000-8000-000000000001', '2026-07-01', 'dinner', 'カレー', 800, 20, 25, 100, 500);
insert into meals (id, user_id, date, meal_type)
values ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000001', '2026-07-01', 'dinner');
insert into meal_items (meal_id, name, calories, protein, fat, carbs, cost, sort_order) values
  ('00000000-0000-4000-8000-0000000000a1', 'ラーメン', 600, 20, 18, 80, 900, 0),
  ('00000000-0000-4000-8000-0000000000a1', '餃子', 300, 12, 15, 25, 300, 1);

-- Day 2: plan only, no meal record
insert into meal_plans (user_id, date, meal_type, planned_name, calories, protein, fat, carbs, estimated_cost)
values ('00000000-0000-4000-8000-000000000001', '2026-07-02', 'lunch', 'そば', 400, 12, 5, 70, 400);

-- Day 3: meal record, no plan
insert into meals (id, user_id, date, meal_type)
values ('00000000-0000-4000-8000-0000000000a3', '00000000-0000-4000-8000-000000000001', '2026-07-03', 'breakfast');
insert into meal_items (meal_id, name, calories, protein, fat, carbs, cost, sort_order)
values ('00000000-0000-4000-8000-0000000000a3', 'トースト', 250, 8, 6, 40, 100, 0);

-- Out of range
insert into meals (id, user_id, date, meal_type)
values ('00000000-0000-4000-8000-0000000000a4', '00000000-0000-4000-8000-000000000001', '2026-07-04', 'lunch');
insert into meal_items (meal_id, name, calories, protein, fat, carbs, cost, sort_order)
values ('00000000-0000-4000-8000-0000000000a4', '寿司', 500, 25, 10, 70, 1200, 0);

select is(
  sync_meals_to_plans('2026-07-01', '2026-07-03'),
  2,
  'two slots with meal records are replaced'
);
select is(
  (select count(*) from meal_plans
   where user_id = '00000000-0000-4000-8000-000000000001' and date = '2026-07-01' and meal_type = 'dinner'),
  2::bigint,
  'day 1: the slot holds one plan per eaten item'
);
select is_empty(
  $$ select id from meal_plans
     where user_id = '00000000-0000-4000-8000-000000000001' and date = '2026-07-01' and planned_name = 'カレー' $$,
  'day 1: the original plan カレー is replaced'
);
select is_empty(
  $$ select id from meal_plans
     where user_id = '00000000-0000-4000-8000-000000000001' and date = '2026-07-01' and is_transferred = false $$,
  'day 1: every plan is marked is_transferred'
);
select results_eq(
  $$ select planned_name from meal_plans
     where user_id = '00000000-0000-4000-8000-000000000001' and date = '2026-07-02' $$,
  $$ values ('そば') $$,
  'day 2: a slot without meal records keeps its plan'
);
select results_eq(
  $$ select planned_name from meal_plans
     where user_id = '00000000-0000-4000-8000-000000000001' and date = '2026-07-03' $$,
  $$ values ('トースト') $$,
  'day 3: a plan is created from the meal record'
);
select is_empty(
  $$ select id from meal_plans
     where user_id = '00000000-0000-4000-8000-000000000001' and date = '2026-07-04' $$,
  'a date outside the range is not touched'
);
select is(
  sync_meals_to_plans('2026-07-01', '2026-07-03'),
  2,
  'a second run replaces the same two slots again'
);
select is(
  (select count(*) from meal_plans
   where user_id = '00000000-0000-4000-8000-000000000001' and date = '2026-07-01'),
  2::bigint,
  'a second run leaves the same plans (idempotent)'
);

-- As user B
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

select results_eq(
  $$ select planned_name from meal_plans where date = '2026-07-01' and meal_type = 'dinner' $$,
  $$ values ('Bのハンバーグ') $$,
  'A''s sync leaves B''s plan in the same slot untouched'
);
select is_empty(
  $$ select id from meal_plans where user_id = '00000000-0000-4000-8000-000000000001' $$,
  'B cannot see A''s plans'
);

select * from finish();
rollback;
