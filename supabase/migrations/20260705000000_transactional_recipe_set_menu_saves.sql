-- Save a recipe and its ingredients in a single transaction.
-- Replaces the client-side update -> delete -> insert sequence that could
-- lose all ingredients when a step failed mid-way.
-- SECURITY INVOKER so RLS policies still apply to every statement.
CREATE OR REPLACE FUNCTION public.save_recipe_with_ingredients(
  p_id UUID,
  p_name TEXT,
  p_servings INTEGER,
  p_calories NUMERIC,
  p_protein NUMERIC,
  p_fat NUMERIC,
  p_carbs NUMERIC,
  p_notes TEXT,
  p_ingredients JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_recipe_id UUID;
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE recipes
    SET name = p_name,
        servings = p_servings,
        calories = p_calories,
        protein = p_protein,
        fat = p_fat,
        carbs = p_carbs,
        notes = p_notes,
        updated_at = NOW()
    WHERE id = p_id AND user_id = auth.uid();

    IF NOT FOUND THEN
      RAISE EXCEPTION 'recipe not found';
    END IF;

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

-- Save a set menu and its items in a single transaction.
-- Same rationale as save_recipe_with_ingredients.
CREATE OR REPLACE FUNCTION public.save_set_menu_with_items(
  p_id UUID,
  p_name TEXT,
  p_total_calories NUMERIC,
  p_total_protein NUMERIC,
  p_total_fat NUMERIC,
  p_total_carbs NUMERIC,
  p_total_cost NUMERIC,
  p_items JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_menu_id UUID;
BEGIN
  IF p_id IS NOT NULL THEN
    UPDATE set_menus
    SET name = p_name,
        total_calories = p_total_calories,
        total_protein = p_total_protein,
        total_fat = p_total_fat,
        total_carbs = p_total_carbs,
        total_cost = p_total_cost,
        updated_at = NOW()
    WHERE id = p_id AND user_id = auth.uid();

    IF NOT FOUND THEN
      RAISE EXCEPTION 'set menu not found';
    END IF;

    v_menu_id := p_id;

    DELETE FROM set_menu_items WHERE set_menu_id = v_menu_id;
  ELSE
    INSERT INTO set_menus (user_id, name, total_calories, total_protein, total_fat, total_carbs, total_cost)
    VALUES (auth.uid(), p_name, p_total_calories, p_total_protein, p_total_fat, p_total_carbs, p_total_cost)
    RETURNING id INTO v_menu_id;
  END IF;

  -- WITH ORDINALITY preserves the client-side item order as sort_order
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
