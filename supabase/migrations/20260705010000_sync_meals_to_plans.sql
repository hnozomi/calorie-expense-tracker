-- Replace planned menus with what was actually eaten, for every slot
-- (date x meal_type) in the given range that has meal records.
-- Slots without meal records are left untouched.
-- Inserted plans get is_transferred = true because they originate from
-- meals, so transfer_plan_to_meal will not copy them back.
-- SECURITY INVOKER so RLS policies still apply to every statement.
CREATE OR REPLACE FUNCTION public.sync_meals_to_plans(
  p_start_date DATE,
  p_end_date DATE
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
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
    WHERE user_id = v_user_id
      AND date = v_slot.date
      AND meal_type = v_slot.meal_type;

    INSERT INTO meal_plans (
      user_id, date, meal_type, planned_name,
      calories, protein, fat, carbs, estimated_cost,
      recipe_id, food_master_id, set_menu_id,
      is_transferred
    )
    SELECT
      v_user_id, v_slot.date, v_slot.meal_type, mi.name,
      mi.calories, mi.protein, mi.fat, mi.carbs, COALESCE(mi.cost, 0),
      mi.recipe_id, mi.food_master_id, mi.set_menu_id,
      TRUE
    FROM meal_items mi
    JOIN meals m ON m.id = mi.meal_id
    WHERE m.user_id = v_user_id
      AND m.date = v_slot.date
      AND m.meal_type = v_slot.meal_type
    ORDER BY mi.sort_order;

    v_replaced_count := v_replaced_count + 1;
  END LOOP;

  RETURN v_replaced_count;
END;
$$;
