-- save_recipe_with_ingredients / save_set_menu_with_items: save the parent and its
-- children in one call, replace the children on update, and refuse ids the caller does not own
begin;
select plan(18);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'user-a@example.com'),
  ('00000000-0000-4000-8000-000000000002', 'user-b@example.com');

-- As user A. The returned ids are kept in transaction-local settings for later statements
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

-- Recipe: insert path
select set_config('test.recipe_id', save_recipe_with_ingredients(null, 'test recipe', 2, 500, 30, 10, 60, null,
  '[{"ingredient_name":"rice","quantity":2,"unit":"cup","unit_price":100}]'::jsonb)::text, true);
select is(
  (select count(*) from recipe_ingredients where recipe_id = current_setting('test.recipe_id')::uuid),
  1::bigint,
  'recipe insert: the ingredient is saved with the recipe'
);

-- Recipe: update path replaces the ingredients
select set_config('test.recipe_id', save_recipe_with_ingredients(current_setting('test.recipe_id')::uuid,
  'renamed', 1, 400, 20, 5, 50, 'memo',
  '[{"ingredient_name":"a","quantity":1,"unit":"g","unit_price":10},{"ingredient_name":"b","quantity":2,"unit":"g","unit_price":20}]'::jsonb)::text, true);
select is(
  (select count(*) from recipe_ingredients where recipe_id = current_setting('test.recipe_id')::uuid),
  2::bigint,
  'recipe update: the ingredients are replaced'
);
select is(
  (select count(*) from recipes where id = current_setting('test.recipe_id')::uuid and name = 'renamed' and notes = 'memo'),
  1::bigint,
  'recipe update: the recipe fields are updated'
);
select throws_ok(
  $$ select save_recipe_with_ingredients(gen_random_uuid(), 'x', 1, 0, 0, 0, 0, null, '[]'::jsonb) $$,
  'P0001', 'recipe not found',
  'updating an unknown recipe id fails'
);

-- Set menu: insert path keeps the item order in sort_order
select set_config('test.menu_id', save_set_menu_with_items(null, 'menu', 800, 40, 20, 100, 1200,
  '[{"name":"item1","recipe_id":null,"food_master_id":null,"calories":400,"protein":20,"fat":10,"carbs":50,"cost":600,"serving_quantity":1},{"name":"item2","recipe_id":null,"food_master_id":null,"calories":400,"protein":20,"fat":10,"carbs":50,"cost":600,"serving_quantity":2}]'::jsonb)::text, true);
select is(
  (select count(*) from set_menu_items where set_menu_id = current_setting('test.menu_id')::uuid),
  2::bigint,
  'set menu insert: the items are saved with the menu'
);
select is(
  (select count(*) from set_menu_items where set_menu_id = current_setting('test.menu_id')::uuid and name = 'item2' and sort_order = 1),
  1::bigint,
  'set menu insert: sort_order follows the array order'
);

-- Set menu: update path replaces the items
select set_config('test.menu_id', save_set_menu_with_items(current_setting('test.menu_id')::uuid,
  'menu2', 400, 20, 10, 50, 600,
  '[{"name":"only","recipe_id":null,"food_master_id":null,"calories":400,"protein":20,"fat":10,"carbs":50,"cost":600,"serving_quantity":1}]'::jsonb)::text, true);
select is(
  (select count(*) from set_menu_items where set_menu_id = current_setting('test.menu_id')::uuid),
  1::bigint,
  'set menu update: the items are replaced'
);

-- As user B
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

select is_empty(
  $$ select id from recipes where id = current_setting('test.recipe_id')::uuid $$,
  'B cannot see A''s recipe'
);
select throws_ok(
  format($$ select save_recipe_with_ingredients(%L::uuid, 'hijack', 1, 0, 0, 0, 0, null, '[]'::jsonb) $$,
         current_setting('test.recipe_id')),
  'P0001', 'recipe not found',
  'B cannot update A''s recipe'
);
select throws_ok(
  format($$ select save_set_menu_with_items(%L::uuid, 'hijack', 0, 0, 0, 0, 0, '[]'::jsonb) $$,
         current_setting('test.menu_id')),
  'P0001', 'set menu not found',
  'B cannot update A''s set menu'
);

-- Back to user A
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select is(
  (select count(*) from recipe_ingredients where recipe_id = current_setting('test.recipe_id')::uuid),
  2::bigint,
  'B''s attempt left A''s recipe ingredients in place'
);
select is(
  (select count(*) from set_menu_items where set_menu_id = current_setting('test.menu_id')::uuid),
  1::bigint,
  'B''s attempt left A''s set menu items in place'
);

-- A soft-deleted recipe is not saved (edited elsewhere after it was deleted): same error as an unknown id
update recipes set deleted_at = now() where id = current_setting('test.recipe_id')::uuid;
select throws_ok(
  format($$ select save_recipe_with_ingredients(%L::uuid, 'after delete', 3, 999, 9, 9, 9, 'changed',
    '[{"ingredient_name":"z","quantity":9,"unit":"kg","unit_price":99}]'::jsonb) $$,
         current_setting('test.recipe_id')),
  'P0001', 'recipe not found',
  'saving a deleted recipe fails'
);
select is(
  (select count(*) from recipes
    where id = current_setting('test.recipe_id')::uuid
      and name = 'renamed' and servings = 1 and calories = 400 and protein = 20 and fat = 5 and carbs = 50
      and notes = 'memo' and deleted_at is not null),
  1::bigint,
  'saving a deleted recipe leaves the recipe row as it was'
);
select results_eq(
  $$ select ingredient_name, quantity, unit, unit_price from recipe_ingredients
     where recipe_id = current_setting('test.recipe_id')::uuid order by ingredient_name $$,
  $$ values ('a'::text, 1::numeric, 'g'::text, 10::numeric), ('b', 2, 'g', 20) $$,
  'saving a deleted recipe leaves its ingredients as they were'
);

-- A soft-deleted set menu is not saved either (keep_deleted_set_menus_unsaved): same error as an unknown id
update set_menus set deleted_at = now() where id = current_setting('test.menu_id')::uuid;
select throws_ok(
  format($$ select save_set_menu_with_items(%L::uuid, 'after delete', 999, 9, 9, 9, 99,
    '[{"name":"z","recipe_id":null,"food_master_id":null,"calories":999,"protein":9,"fat":9,"carbs":9,"cost":99,"serving_quantity":3}]'::jsonb) $$,
         current_setting('test.menu_id')),
  'P0001', 'set menu not found',
  'saving a deleted set menu fails'
);
select is(
  (select count(*) from set_menus
    where id = current_setting('test.menu_id')::uuid
      and name = 'menu2' and total_calories = 400 and total_protein = 20 and total_fat = 10
      and total_carbs = 50 and total_cost = 600 and deleted_at is not null),
  1::bigint,
  'saving a deleted set menu leaves the set menu row as it was'
);
select results_eq(
  $$ select name, calories, cost, serving_quantity, sort_order from set_menu_items
     where set_menu_id = current_setting('test.menu_id')::uuid order by sort_order $$,
  $$ values ('only'::text, 400::numeric, 600::numeric, 1::numeric, 0::integer) $$,
  'saving a deleted set menu leaves its items as they were'
);

select * from finish();
rollback;
