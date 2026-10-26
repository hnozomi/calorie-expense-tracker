-- Security hardening of the RPCs and RLS policies as the baseline installs them:
-- INVOKER RPCs with a pinned search_path, execute grants, (select auth.uid()) in
-- every policy, covering indexes for foreign keys, and the user_settings delete policy
begin;
select plan(17);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'user-a@example.com'),
  ('00000000-0000-4000-8000-000000000002', 'user-b@example.com');

-- Structure
select is(
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prosecdef
     and p.proname in ('get_daily_summary', 'get_weekly_summary', 'register_meal_items',
                       'register_set_menu_to_meal', 'transfer_meal_to_plan', 'transfer_plan_to_meal')),
  0::bigint,
  'the legacy RPCs are SECURITY INVOKER, so RLS applies inside them'
);
select is(
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('get_daily_summary', 'get_weekly_summary', 'register_meal_items',
                       'register_set_menu_to_meal', 'transfer_meal_to_plan', 'transfer_plan_to_meal',
                       'update_updated_at')
     and (p.proconfig is null or not exists (
       select 1 from unnest(p.proconfig) c where c like 'search_path=%'))),
  0::bigint,
  'the legacy RPCs and update_updated_at pin their search_path'
);
select ok(
  not has_function_privilege('anon', 'public.register_meal_items(uuid, jsonb)', 'EXECUTE'),
  'anon cannot execute the write RPC register_meal_items'
);
-- Vercel SSG prerenders /other/report with the anon key at build time; under INVOKER + RLS anon only gets empty rows
select ok(
  has_function_privilege('anon', 'public.get_weekly_summary(date)', 'EXECUTE'),
  'anon keeps execute on the read-only get_weekly_summary (Vercel SSG)'
);
select ok(
  has_function_privilege('authenticated', 'public.register_meal_items(uuid, jsonb)', 'EXECUTE'),
  'authenticated can execute register_meal_items'
);
select is(
  (select count(*) from pg_policies
   where schemaname = 'public'
     and (coalesce(qual, '') || coalesce(with_check, '')) like '%auth.uid()%'
     and (coalesce(qual, '') || coalesce(with_check, '')) not like '%( SELECT auth.uid()%'),
  0::bigint,
  'no policy evaluates auth.uid() per row'
);
select is(
  (select count(*) from pg_indexes where schemaname = 'public' and indexname in (
    'idx_meal_items_food_master_id', 'idx_meal_plans_food_master_id', 'idx_meal_plans_recipe_id',
    'idx_meal_plans_set_menu_id', 'idx_set_menu_items_food_master_id', 'idx_set_menu_items_recipe_id')),
  6::bigint,
  'the six foreign keys have covering indexes'
);

-- As user A
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select lives_ok(
  $$ select * from get_daily_summary(current_date) $$,
  'get_daily_summary runs under INVOKER'
);
select lives_ok(
  $$ select * from get_weekly_summary(current_date) $$,
  'get_weekly_summary runs under INVOKER'
);
select lives_ok(
  $$ insert into meals (id, user_id, date, meal_type)
     values ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000001', '2099-01-01', 'lunch') $$,
  'A adds a meal of their own'
);
select lives_ok(
  $$ select register_meal_items('00000000-0000-4000-8000-0000000000a1',
       '[{"name":"検証品","calories":100,"protein":1,"fat":1,"carbs":1,"cost":null,"source_type":"manual","food_master_id":null,"recipe_id":null,"set_menu_id":null}]'::jsonb) $$,
  'A registers an item through register_meal_items'
);
select is(
  (select count(*) from meal_items where meal_id = '00000000-0000-4000-8000-0000000000a1'),
  1::bigint,
  'register_meal_items under INVOKER inserts the item'
);
select lives_ok(
  $$ insert into user_settings (user_id, target_calories) values ('00000000-0000-4000-8000-000000000001', 1234) $$,
  'A adds their settings'
);

-- As user B
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

select is_empty(
  $$ select id from meal_items where meal_id = '00000000-0000-4000-8000-0000000000a1' $$,
  'B cannot see A''s meal items'
);
select throws_ok(
  $$ select register_meal_items('00000000-0000-4000-8000-0000000000a1',
       '[{"name":"他人の品","calories":1,"protein":1,"fat":1,"carbs":1}]'::jsonb) $$,
  'P0001', 'meal not found or access denied',
  'B cannot register items into A''s meal'
);
delete from user_settings where user_id = '00000000-0000-4000-8000-000000000001';

-- Back to user A
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select is(
  (select target_calories from user_settings where user_id = '00000000-0000-4000-8000-000000000001'),
  1234::numeric,
  'B''s delete left A''s settings in place'
);
delete from user_settings where user_id = '00000000-0000-4000-8000-000000000001';
select is_empty(
  $$ select id from user_settings where user_id = '00000000-0000-4000-8000-000000000001' $$,
  'the owner can delete their user_settings row'
);

select * from finish();
rollback;
