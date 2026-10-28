-- Same as keep_deleted_recipes_unsaved, for set menus: saving an edit to a set menu that was soft-deleted
-- meanwhile used to update the deleted row and report success. A deleted one now raises 'set menu not found'
-- like an unknown id. Same signature, so the grants stay as they are.
CREATE OR REPLACE FUNCTION "public"."save_set_menu_with_items"("p_id" "uuid", "p_name" "text", "p_total_calories" numeric, "p_total_protein" numeric, "p_total_fat" numeric, "p_total_carbs" numeric, "p_total_cost" numeric, "p_items" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
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
    WHERE id = p_id AND user_id = auth.uid() AND deleted_at IS NULL;

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
