-- Verification for 20260705000000_transactional_recipe_set_menu_saves.sql
-- Runs entirely in a transaction and ROLLBACKs at the end — safe on a real DB.
-- Replace p_test_user_id below with an existing auth.users id before running.

BEGIN;

-- (Re)create the functions under test so this script is self-contained.
-- Definitions must match the migration file.
CREATE OR REPLACE FUNCTION public.save_recipe_with_ingredients(
  p_id UUID, p_name TEXT, p_servings INTEGER, p_calories NUMERIC, p_protein NUMERIC,
  p_fat NUMERIC, p_carbs NUMERIC, p_notes TEXT, p_ingredients JSONB
) RETURNS UUID LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_recipe_id UUID;
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE recipes
    SET name = p_name, servings = p_servings, calories = p_calories, protein = p_protein,
        fat = p_fat, carbs = p_carbs, notes = p_notes, updated_at = NOW()
    WHERE id = p_id AND user_id = auth.uid();
    IF NOT FOUND THEN RAISE EXCEPTION 'recipe not found'; END IF;
    v_recipe_id := p_id;
    DELETE FROM recipe_ingredients WHERE recipe_id = v_recipe_id;
  ELSE
    INSERT INTO recipes (user_id, name, servings, calories, protein, fat, carbs, notes)
    VALUES (auth.uid(), p_name, p_servings, p_calories, p_protein, p_fat, p_carbs, p_notes)
    RETURNING id INTO v_recipe_id;
  END IF;
  INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit, unit_price)
  SELECT v_recipe_id, x.ingredient_name, x.quantity, x.unit, x.unit_price
  FROM jsonb_to_recordset(COALESCE(p_ingredients, '[]'::JSONB))
    AS x(ingredient_name TEXT, quantity NUMERIC, unit TEXT, unit_price NUMERIC);
  RETURN v_recipe_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_set_menu_with_items(
  p_id UUID, p_name TEXT, p_total_calories NUMERIC, p_total_protein NUMERIC,
  p_total_fat NUMERIC, p_total_carbs NUMERIC, p_total_cost NUMERIC, p_items JSONB
) RETURNS UUID LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_menu_id UUID;
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE set_menus
    SET name = p_name, total_calories = p_total_calories, total_protein = p_total_protein,
        total_fat = p_total_fat, total_carbs = p_total_carbs, total_cost = p_total_cost,
        updated_at = NOW()
    WHERE id = p_id AND user_id = auth.uid();
    IF NOT FOUND THEN RAISE EXCEPTION 'set menu not found'; END IF;
    v_menu_id := p_id;
    DELETE FROM set_menu_items WHERE set_menu_id = v_menu_id;
  ELSE
    INSERT INTO set_menus (user_id, name, total_calories, total_protein, total_fat, total_carbs, total_cost)
    VALUES (auth.uid(), p_name, p_total_calories, p_total_protein, p_total_fat, p_total_carbs, p_total_cost)
    RETURNING id INTO v_menu_id;
  END IF;
  INSERT INTO set_menu_items (
    set_menu_id, name, recipe_id, food_master_id,
    calories, protein, fat, carbs, cost, serving_quantity, sort_order
  )
  SELECT v_menu_id, x.name, x.recipe_id, x.food_master_id,
         x.calories, x.protein, x.fat, x.carbs, x.cost, x.serving_quantity,
         (e.ord - 1)::INTEGER
  FROM jsonb_array_elements(COALESCE(p_items, '[]'::JSONB)) WITH ORDINALITY AS e(elem, ord)
  CROSS JOIN LATERAL jsonb_to_record(e.elem)
    AS x(name TEXT, recipe_id UUID, food_master_id UUID,
         calories NUMERIC, protein NUMERIC, fat NUMERIC, carbs NUMERIC,
         cost NUMERIC, serving_quantity NUMERIC);
  RETURN v_menu_id;
END;
$$;

-- Impersonate an authenticated user so auth.uid() and RLS behave as in production.
-- >>> REPLACE the sub value with an existing auth.users id <<<
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

DO $test$
DECLARE
  v_uid UUID := current_setting('request.jwt.claims', true)::json->>'sub';
  rid UUID;
  mid UUID;
  cnt INT;
  got_error BOOLEAN := FALSE;
BEGIN
  -- recipe insert path
  rid := save_recipe_with_ingredients(NULL, 'test recipe', 2, 500, 30, 10, 60, NULL,
    '[{"ingredient_name":"rice","quantity":2,"unit":"cup","unit_price":100}]'::JSONB);
  SELECT count(*) INTO cnt FROM recipe_ingredients WHERE recipe_id = rid;
  IF cnt <> 1 THEN RAISE EXCEPTION 'recipe insert: ingredient count %', cnt; END IF;

  -- recipe update path (replaces ingredients atomically)
  rid := save_recipe_with_ingredients(rid, 'renamed', 1, 400, 20, 5, 50, 'memo',
    '[{"ingredient_name":"a","quantity":1,"unit":"g","unit_price":10},{"ingredient_name":"b","quantity":2,"unit":"g","unit_price":20}]'::JSONB);
  SELECT count(*) INTO cnt FROM recipe_ingredients WHERE recipe_id = rid;
  IF cnt <> 2 THEN RAISE EXCEPTION 'recipe update: ingredient count %', cnt; END IF;
  SELECT count(*) INTO cnt FROM recipes WHERE id = rid AND name = 'renamed' AND notes = 'memo';
  IF cnt <> 1 THEN RAISE EXCEPTION 'recipe update: fields not updated'; END IF;

  -- updating an unknown/foreign id must fail (RLS + NOT FOUND)
  BEGIN
    PERFORM save_recipe_with_ingredients(gen_random_uuid(), 'x', 1, 0, 0, 0, 0, NULL, '[]'::JSONB);
  EXCEPTION WHEN OTHERS THEN got_error := TRUE;
  END;
  IF NOT got_error THEN RAISE EXCEPTION 'unknown recipe id did not fail'; END IF;

  -- set menu insert path preserves item order via sort_order
  mid := save_set_menu_with_items(NULL, 'menu', 800, 40, 20, 100, 1200,
    '[{"name":"item1","recipe_id":null,"food_master_id":null,"calories":400,"protein":20,"fat":10,"carbs":50,"cost":600,"serving_quantity":1},{"name":"item2","recipe_id":null,"food_master_id":null,"calories":400,"protein":20,"fat":10,"carbs":50,"cost":600,"serving_quantity":2}]'::JSONB);
  SELECT count(*) INTO cnt FROM set_menu_items WHERE set_menu_id = mid;
  IF cnt <> 2 THEN RAISE EXCEPTION 'set menu insert: item count %', cnt; END IF;
  SELECT count(*) INTO cnt FROM set_menu_items WHERE set_menu_id = mid AND name = 'item2' AND sort_order = 1;
  IF cnt <> 1 THEN RAISE EXCEPTION 'set menu insert: sort order wrong'; END IF;

  -- set menu update path replaces items
  mid := save_set_menu_with_items(mid, 'menu2', 400, 20, 10, 50, 600,
    '[{"name":"only","recipe_id":null,"food_master_id":null,"calories":400,"protein":20,"fat":10,"carbs":50,"cost":600,"serving_quantity":1}]'::JSONB);
  SELECT count(*) INTO cnt FROM set_menu_items WHERE set_menu_id = mid;
  IF cnt <> 1 THEN RAISE EXCEPTION 'set menu update: item count %', cnt; END IF;

  RAISE NOTICE 'ALL ASSERTIONS PASSED';
END;
$test$;

ROLLBACK;
