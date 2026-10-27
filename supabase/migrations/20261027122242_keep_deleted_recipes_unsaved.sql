-- Saving an edit to a recipe that was soft-deleted meanwhile (another tab or device) used to update the
-- deleted row and report success. Only recipes that are not deleted can be updated; a deleted one raises
-- 'recipe not found' like an unknown id. Same signature, so the grants stay as they are.
CREATE OR REPLACE FUNCTION "public"."save_recipe_with_ingredients"("p_id" "uuid", "p_name" "text", "p_servings" integer, "p_calories" numeric, "p_protein" numeric, "p_fat" numeric, "p_carbs" numeric, "p_notes" "text", "p_ingredients" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
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
    WHERE id = p_id AND user_id = auth.uid() AND deleted_at IS NULL;

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
