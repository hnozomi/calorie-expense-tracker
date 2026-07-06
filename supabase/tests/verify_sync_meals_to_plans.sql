-- Verification for 20260705010000_sync_meals_to_plans.sql
-- Runs entirely in a transaction and ROLLBACKs at the end — safe on a real DB.
-- Replace the sub value in set_config with an existing auth.users id before running.

BEGIN;

-- Definition must match the migration file.
CREATE OR REPLACE FUNCTION public.sync_meals_to_plans(
  p_start_date DATE,
  p_end_date DATE
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_slot RECORD;
  v_replaced_count INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  FOR v_slot IN
    SELECT m.date, m.meal_type
    FROM meals m
    WHERE m.user_id = v_user_id
      AND m.date BETWEEN p_start_date AND p_end_date
      AND EXISTS (SELECT 1 FROM meal_items mi WHERE mi.meal_id = m.id)
    ORDER BY m.date, m.meal_type
  LOOP
    DELETE FROM meal_plans
    WHERE user_id = v_user_id AND date = v_slot.date AND meal_type = v_slot.meal_type;

    INSERT INTO meal_plans (
      user_id, date, meal_type, planned_name,
      calories, protein, fat, carbs, estimated_cost,
      recipe_id, food_master_id, set_menu_id, is_transferred
    )
    SELECT
      v_user_id, v_slot.date, v_slot.meal_type, mi.name,
      mi.calories, mi.protein, mi.fat, mi.carbs, COALESCE(mi.cost, 0),
      mi.recipe_id, mi.food_master_id, mi.set_menu_id, TRUE
    FROM meal_items mi
    JOIN meals m ON m.id = mi.meal_id
    WHERE m.user_id = v_user_id AND m.date = v_slot.date AND m.meal_type = v_slot.meal_type
    ORDER BY mi.sort_order;

    v_replaced_count := v_replaced_count + 1;
  END LOOP;

  RETURN v_replaced_count;
END;
$$;

-- Impersonate an authenticated user so auth.uid() and RLS behave as in production.
-- >>> REPLACE the sub value with an existing auth.users id <<<
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

DO $test$
DECLARE
  v_uid UUID := current_setting('request.jwt.claims', true)::json->>'sub';
  v_meal_id UUID;
  v_count INT;
  v_result INT;
  v_name TEXT;
BEGIN
  -- Day 1: planned "カレー" but actually ate "ラーメン" + "餃子"
  INSERT INTO meal_plans (user_id, date, meal_type, planned_name, calories, protein, fat, carbs, estimated_cost)
  VALUES (v_uid, '2026-07-01', 'dinner', 'カレー', 800, 20, 25, 100, 500);

  INSERT INTO meals (user_id, date, meal_type) VALUES (v_uid, '2026-07-01', 'dinner') RETURNING id INTO v_meal_id;
  INSERT INTO meal_items (meal_id, name, calories, protein, fat, carbs, cost, sort_order)
  VALUES (v_meal_id, 'ラーメン', 600, 20, 18, 80, 900, 0), (v_meal_id, '餃子', 300, 12, 15, 25, 300, 1);

  -- Day 2: plan only, NO meal record → must stay untouched
  INSERT INTO meal_plans (user_id, date, meal_type, planned_name, calories, protein, fat, carbs, estimated_cost)
  VALUES (v_uid, '2026-07-02', 'lunch', 'そば', 400, 12, 5, 70, 400);

  -- Day 3: meal record, no plan → plan gets created
  INSERT INTO meals (user_id, date, meal_type) VALUES (v_uid, '2026-07-03', 'breakfast') RETURNING id INTO v_meal_id;
  INSERT INTO meal_items (meal_id, name, calories, protein, fat, carbs, cost, sort_order)
  VALUES (v_meal_id, 'トースト', 250, 8, 6, 40, 100, 0);

  -- Out of range: must not be touched
  INSERT INTO meals (user_id, date, meal_type) VALUES (v_uid, '2026-07-04', 'lunch') RETURNING id INTO v_meal_id;
  INSERT INTO meal_items (meal_id, name, calories, protein, fat, carbs, cost, sort_order)
  VALUES (v_meal_id, '寿司', 500, 25, 10, 70, 1200, 0);

  v_result := sync_meals_to_plans('2026-07-01', '2026-07-03');
  IF v_result <> 2 THEN RAISE EXCEPTION 'expected 2 replaced slots, got %', v_result; END IF;

  -- Day 1: カレー replaced by ラーメン+餃子, all is_transferred = true
  SELECT count(*) INTO v_count FROM meal_plans WHERE user_id = v_uid AND date = '2026-07-01' AND meal_type = 'dinner';
  IF v_count <> 2 THEN RAISE EXCEPTION 'day1: expected 2 plans, got %', v_count; END IF;
  SELECT count(*) INTO v_count FROM meal_plans WHERE user_id = v_uid AND date = '2026-07-01' AND planned_name = 'カレー';
  IF v_count <> 0 THEN RAISE EXCEPTION 'day1: カレー should be replaced'; END IF;
  SELECT count(*) INTO v_count FROM meal_plans WHERE user_id = v_uid AND date = '2026-07-01' AND is_transferred = false;
  IF v_count <> 0 THEN RAISE EXCEPTION 'day1: all plans should be is_transferred=true'; END IF;

  -- Day 2: untouched
  SELECT planned_name INTO v_name FROM meal_plans WHERE user_id = v_uid AND date = '2026-07-02';
  IF v_name <> 'そば' THEN RAISE EXCEPTION 'day2: plan should be untouched'; END IF;

  -- Day 3: created from the meal record
  SELECT planned_name INTO v_name FROM meal_plans WHERE user_id = v_uid AND date = '2026-07-03';
  IF v_name <> 'トースト' THEN RAISE EXCEPTION 'day3: plan should be created from meal'; END IF;

  -- Out of range: no plan created
  SELECT count(*) INTO v_count FROM meal_plans WHERE user_id = v_uid AND date = '2026-07-04';
  IF v_count <> 0 THEN RAISE EXCEPTION 'out-of-range date should not be touched'; END IF;

  -- Idempotency: a second run replaces again with the same result
  v_result := sync_meals_to_plans('2026-07-01', '2026-07-03');
  IF v_result <> 2 THEN RAISE EXCEPTION 'second run: expected 2, got %', v_result; END IF;
  SELECT count(*) INTO v_count FROM meal_plans WHERE user_id = v_uid AND date = '2026-07-01';
  IF v_count <> 2 THEN RAISE EXCEPTION 'second run: expected 2 plans, got %', v_count; END IF;

  RAISE NOTICE 'ALL ASSERTIONS PASSED';
END;
$test$;

ROLLBACK;
