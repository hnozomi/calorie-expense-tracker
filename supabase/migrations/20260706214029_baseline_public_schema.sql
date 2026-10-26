-- Baseline of the production public schema (meshi-log), dumped with
-- `supabase db dump --linked --schema public` on 2026-10-24. It replaces the
-- earlier hand-written migrations, whose versions never matched the
-- production history. Already applied in production; recorded there as this
-- version. The schema dump leaves out extensions, so create the one the
-- triggers use.
create extension if not exists moddatetime with schema extensions;




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."get_daily_summary"("p_target_date" "date") RETURNS TABLE("meal_type" "text", "total_calories" numeric, "total_protein" numeric, "total_fat" numeric, "total_carbs" numeric, "total_cost" numeric, "item_count" bigint)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.meal_type,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.calories
        WHEN mi.source_type = 'recipe' AND r.id IS NOT NULL AND r.deleted_at IS NULL
          THEN r.calories / GREATEST(r.servings, 1)
        ELSE mi.calories
      END
    ), 0) AS total_calories,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.protein
        WHEN mi.source_type = 'recipe' AND r.id IS NOT NULL AND r.deleted_at IS NULL
          THEN r.protein / GREATEST(r.servings, 1)
        ELSE mi.protein
      END
    ), 0) AS total_protein,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.fat
        WHEN mi.source_type = 'recipe' AND r.id IS NOT NULL AND r.deleted_at IS NULL
          THEN r.fat / GREATEST(r.servings, 1)
        ELSE mi.fat
      END
    ), 0) AS total_fat,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.carbs
        WHEN mi.source_type = 'recipe' AND r.id IS NOT NULL AND r.deleted_at IS NULL
          THEN r.carbs / GREATEST(r.servings, 1)
        ELSE mi.carbs
      END
    ), 0) AS total_carbs,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.default_price
        ELSE mi.cost
      END
    ), 0) AS total_cost,
    COUNT(mi.id) AS item_count
  FROM meals m
  LEFT JOIN meal_items mi ON mi.meal_id = m.id
  LEFT JOIN food_masters fm ON fm.id = mi.food_master_id
  LEFT JOIN recipes r ON r.id = mi.recipe_id
  WHERE m.user_id = auth.uid() AND m.date = p_target_date
  GROUP BY m.meal_type;
END;
$$;


ALTER FUNCTION "public"."get_daily_summary"("p_target_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_weekly_summary"("p_start_date" "date") RETURNS TABLE("date" "date", "total_calories" numeric, "total_protein" numeric, "total_fat" numeric, "total_carbs" numeric, "total_cost" numeric)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.date::DATE,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.calories
        WHEN mi.source_type = 'recipe' AND r.id IS NOT NULL AND r.deleted_at IS NULL
          THEN r.calories / GREATEST(r.servings, 1)
        ELSE mi.calories
      END
    ), 0) AS total_calories,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.protein
        WHEN mi.source_type = 'recipe' AND r.id IS NOT NULL AND r.deleted_at IS NULL
          THEN r.protein / GREATEST(r.servings, 1)
        ELSE mi.protein
      END
    ), 0) AS total_protein,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.fat
        WHEN mi.source_type = 'recipe' AND r.id IS NOT NULL AND r.deleted_at IS NULL
          THEN r.fat / GREATEST(r.servings, 1)
        ELSE mi.fat
      END
    ), 0) AS total_fat,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.carbs
        WHEN mi.source_type = 'recipe' AND r.id IS NOT NULL AND r.deleted_at IS NULL
          THEN r.carbs / GREATEST(r.servings, 1)
        ELSE mi.carbs
      END
    ), 0) AS total_carbs,
    COALESCE(SUM(
      CASE
        WHEN mi.source_type = 'food_master' AND fm.id IS NOT NULL AND fm.deleted_at IS NULL
          THEN fm.default_price
        ELSE mi.cost
      END
    ), 0) AS total_cost
  FROM generate_series(p_start_date::TIMESTAMP, (p_start_date + 6)::TIMESTAMP, '1 day'::INTERVAL) AS d(date)
  LEFT JOIN meals m ON m.date = d.date::DATE AND m.user_id = auth.uid()
  LEFT JOIN meal_items mi ON mi.meal_id = m.id
  LEFT JOIN food_masters fm ON fm.id = mi.food_master_id
  LEFT JOIN recipes r ON r.id = mi.recipe_id
  GROUP BY d.date
  ORDER BY d.date;
END;
$$;


ALTER FUNCTION "public"."get_weekly_summary"("p_start_date" "date") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."meal_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meal_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "calories" numeric DEFAULT 0 NOT NULL,
    "protein" numeric DEFAULT 0 NOT NULL,
    "fat" numeric DEFAULT 0 NOT NULL,
    "carbs" numeric DEFAULT 0 NOT NULL,
    "cost" numeric,
    "source_type" "text" DEFAULT 'manual'::"text" NOT NULL,
    "recipe_id" "uuid",
    "food_master_id" "uuid",
    "set_menu_id" "uuid",
    "serving_quantity" numeric DEFAULT 1 NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "meal_items_source_type_check" CHECK (("source_type" = ANY (ARRAY['manual'::"text", 'ocr'::"text", 'recipe'::"text", 'food_master'::"text", 'set_menu'::"text"])))
);


ALTER TABLE "public"."meal_items" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_meal_items"("p_meal_id" "uuid", "p_items" "jsonb") RETURNS SETOF "public"."meal_items"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  item JSONB;
  inserted meal_items;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM meals WHERE id = p_meal_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'meal not found or access denied';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO meal_items (
      meal_id, name, calories, protein, fat, carbs, cost,
      source_type, recipe_id, food_master_id, set_menu_id,
      serving_quantity, sort_order
    ) VALUES (
      p_meal_id,
      item->>'name',
      (item->>'calories')::NUMERIC,
      (item->>'protein')::NUMERIC,
      (item->>'fat')::NUMERIC,
      (item->>'carbs')::NUMERIC,
      (item->>'cost')::NUMERIC,
      COALESCE(item->>'source_type', 'manual'),
      (item->>'recipe_id')::UUID,
      (item->>'food_master_id')::UUID,
      (item->>'set_menu_id')::UUID,
      COALESCE((item->>'serving_quantity')::NUMERIC, 1),
      COALESCE((item->>'sort_order')::INTEGER, 0)
    )
    RETURNING * INTO inserted;
    RETURN NEXT inserted;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."register_meal_items"("p_meal_id" "uuid", "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_set_menu_to_meal"("p_set_menu_id" "uuid", "p_meal_id" "uuid") RETURNS SETOF "public"."meal_items"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  rec set_menu_items;
  inserted meal_items;
BEGIN
  -- Check meal belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM meals WHERE id = p_meal_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'meal not found or access denied';
  END IF;

  -- Check set_menu belongs to user and not deleted
  IF NOT EXISTS (
    SELECT 1 FROM set_menus WHERE id = p_set_menu_id AND user_id = auth.uid() AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'set_menu not found or access denied';
  END IF;

  FOR rec IN
    SELECT * FROM set_menu_items WHERE set_menu_id = p_set_menu_id ORDER BY sort_order
  LOOP
    INSERT INTO meal_items (
      meal_id, name, calories, protein, fat, carbs, cost,
      source_type, recipe_id, food_master_id, set_menu_id,
      serving_quantity, sort_order
    ) VALUES (
      p_meal_id,
      rec.name,
      rec.calories * rec.serving_quantity,
      rec.protein * rec.serving_quantity,
      rec.fat * rec.serving_quantity,
      rec.carbs * rec.serving_quantity,
      rec.cost * rec.serving_quantity,
      'set_menu',
      rec.recipe_id,
      rec.food_master_id,
      p_set_menu_id,
      rec.serving_quantity,
      rec.sort_order
    )
    RETURNING * INTO inserted;

    RETURN NEXT inserted;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."register_set_menu_to_meal"("p_set_menu_id" "uuid", "p_meal_id" "uuid") OWNER TO "postgres";


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


ALTER FUNCTION "public"."save_recipe_with_ingredients"("p_id" "uuid", "p_name" "text", "p_servings" integer, "p_calories" numeric, "p_protein" numeric, "p_fat" numeric, "p_carbs" numeric, "p_notes" "text", "p_ingredients" "jsonb") OWNER TO "postgres";


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


ALTER FUNCTION "public"."save_set_menu_with_items"("p_id" "uuid", "p_name" "text", "p_total_calories" numeric, "p_total_protein" numeric, "p_total_fat" numeric, "p_total_carbs" numeric, "p_total_cost" numeric, "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_meals_to_plans"("p_start_date" "date", "p_end_date" "date") RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."sync_meals_to_plans"("p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transfer_meal_to_plan"("p_target_date" "date", "p_meal_type" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_item RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  FOR v_item IN
    SELECT mi.*
    FROM meal_items mi
    JOIN meals m ON m.id = mi.meal_id
    WHERE m.user_id = v_user_id
      AND m.date = p_target_date
      AND m.meal_type = p_meal_type
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM meal_plans
      WHERE user_id = v_user_id
        AND date = p_target_date
        AND meal_type = p_meal_type
        AND planned_name = v_item.name
    ) THEN
      INSERT INTO meal_plans (
        id, user_id, date, meal_type, planned_name,
        calories, protein, fat, carbs, estimated_cost,
        recipe_id, food_master_id, set_menu_id,
        is_transferred
      ) VALUES (
        gen_random_uuid(), v_user_id, p_target_date, p_meal_type, v_item.name,
        v_item.calories, v_item.protein, v_item.fat, v_item.carbs, COALESCE(v_item.cost, 0),
        v_item.recipe_id, v_item.food_master_id, v_item.set_menu_id,
        false
      );
    END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."transfer_meal_to_plan"("p_target_date" "date", "p_meal_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transfer_plan_to_meal"("p_target_date" "date", "p_meal_type" "text") RETURNS SETOF "public"."meal_items"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_meal_id UUID;
  plan meal_plans;
  inserted meal_items;
BEGIN
  -- Get or create the meal for the target date and type
  SELECT id INTO v_meal_id
  FROM meals
  WHERE user_id = auth.uid() AND date = p_target_date AND meal_type = p_meal_type;

  IF v_meal_id IS NULL THEN
    INSERT INTO meals (user_id, date, meal_type)
    VALUES (auth.uid(), p_target_date, p_meal_type)
    RETURNING id INTO v_meal_id;
  END IF;

  -- Convert untransferred plans to meal_items
  FOR plan IN
    SELECT * FROM meal_plans
    WHERE user_id = auth.uid()
      AND date = p_target_date
      AND meal_type = p_meal_type
      AND is_transferred = false
  LOOP
    INSERT INTO meal_items (
      meal_id, name, calories, protein, fat, carbs, cost,
      source_type, recipe_id, food_master_id, set_menu_id,
      serving_quantity, sort_order
    ) VALUES (
      v_meal_id,
      plan.planned_name,
      plan.calories,
      plan.protein,
      plan.fat,
      plan.carbs,
      plan.estimated_cost,
      CASE
        WHEN plan.set_menu_id IS NOT NULL THEN 'set_menu'
        WHEN plan.recipe_id IS NOT NULL THEN 'recipe'
        WHEN plan.food_master_id IS NOT NULL THEN 'food_master'
        ELSE 'manual'
      END,
      plan.recipe_id,
      plan.food_master_id,
      plan.set_menu_id,
      1,
      0
    )
    RETURNING * INTO inserted;

    -- Mark plan as transferred
    UPDATE meal_plans SET is_transferred = true WHERE id = plan.id;

    RETURN NEXT inserted;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."transfer_plan_to_meal"("p_target_date" "date", "p_meal_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."food_masters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "brand" "text",
    "category" "text",
    "calories" numeric DEFAULT 0 NOT NULL,
    "protein" numeric DEFAULT 0 NOT NULL,
    "fat" numeric DEFAULT 0 NOT NULL,
    "carbs" numeric DEFAULT 0 NOT NULL,
    "default_price" numeric,
    "notes" "text",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "food_masters_category_check" CHECK ((("category" IS NULL) OR ("category" = ANY (ARRAY['bento'::"text", 'bread'::"text", 'side_dish'::"text", 'snack'::"text", 'drink'::"text", 'ingredient'::"text", 'other'::"text"]))))
);


ALTER TABLE "public"."food_masters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meal_item_costs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meal_item_id" "uuid" NOT NULL,
    "item_name" "text" NOT NULL,
    "unit_price" numeric DEFAULT 0 NOT NULL,
    "quantity" numeric DEFAULT 1 NOT NULL,
    "subtotal" numeric GENERATED ALWAYS AS (("unit_price" * "quantity")) STORED
);


ALTER TABLE "public"."meal_item_costs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meal_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "meal_type" "text" NOT NULL,
    "planned_name" "text" NOT NULL,
    "recipe_id" "uuid",
    "food_master_id" "uuid",
    "set_menu_id" "uuid",
    "calories" numeric DEFAULT 0 NOT NULL,
    "protein" numeric DEFAULT 0 NOT NULL,
    "fat" numeric DEFAULT 0 NOT NULL,
    "carbs" numeric DEFAULT 0 NOT NULL,
    "estimated_cost" numeric DEFAULT 0 NOT NULL,
    "is_transferred" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "meal_plans_meal_type_check" CHECK (("meal_type" = ANY (ARRAY['breakfast'::"text", 'lunch'::"text", 'dinner'::"text", 'snack'::"text"])))
);


ALTER TABLE "public"."meal_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "meal_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "meals_meal_type_check" CHECK (("meal_type" = ANY (ARRAY['breakfast'::"text", 'lunch'::"text", 'dinner'::"text", 'snack'::"text"])))
);


ALTER TABLE "public"."meals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipe_ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "ingredient_name" "text" NOT NULL,
    "quantity" numeric DEFAULT 0 NOT NULL,
    "unit" "text" DEFAULT ''::"text" NOT NULL,
    "unit_price" numeric DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."recipe_ingredients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "servings" integer DEFAULT 1 NOT NULL,
    "calories" numeric DEFAULT 0 NOT NULL,
    "protein" numeric DEFAULT 0 NOT NULL,
    "fat" numeric DEFAULT 0 NOT NULL,
    "carbs" numeric DEFAULT 0 NOT NULL,
    "notes" "text",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."recipes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."set_menu_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "set_menu_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "recipe_id" "uuid",
    "food_master_id" "uuid",
    "calories" numeric DEFAULT 0 NOT NULL,
    "protein" numeric DEFAULT 0 NOT NULL,
    "fat" numeric DEFAULT 0 NOT NULL,
    "carbs" numeric DEFAULT 0 NOT NULL,
    "cost" numeric DEFAULT 0 NOT NULL,
    "serving_quantity" numeric DEFAULT 1 NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."set_menu_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."set_menus" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "total_calories" numeric DEFAULT 0 NOT NULL,
    "total_protein" numeric DEFAULT 0 NOT NULL,
    "total_fat" numeric DEFAULT 0 NOT NULL,
    "total_carbs" numeric DEFAULT 0 NOT NULL,
    "total_cost" numeric DEFAULT 0 NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."set_menus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "target_calories" numeric DEFAULT 2000 NOT NULL,
    "target_protein" numeric DEFAULT 60 NOT NULL,
    "target_fat" numeric DEFAULT 55 NOT NULL,
    "target_carbs" numeric DEFAULT 300 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."food_masters"
    ADD CONSTRAINT "food_masters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meal_item_costs"
    ADD CONSTRAINT "meal_item_costs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meal_items"
    ADD CONSTRAINT "meal_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meals"
    ADD CONSTRAINT "meals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meals"
    ADD CONSTRAINT "meals_user_id_date_meal_type_key" UNIQUE ("user_id", "date", "meal_type");



ALTER TABLE ONLY "public"."recipe_ingredients"
    ADD CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."set_menu_items"
    ADD CONSTRAINT "set_menu_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."set_menus"
    ADD CONSTRAINT "set_menus_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_food_masters_category" ON "public"."food_masters" USING "btree" ("category") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_food_masters_user_id" ON "public"."food_masters" USING "btree" ("user_id");



CREATE INDEX "idx_meal_item_costs_meal_item_id" ON "public"."meal_item_costs" USING "btree" ("meal_item_id");



CREATE INDEX "idx_meal_items_food_master_id" ON "public"."meal_items" USING "btree" ("food_master_id");



CREATE INDEX "idx_meal_items_meal_id" ON "public"."meal_items" USING "btree" ("meal_id");



CREATE INDEX "idx_meal_plans_food_master_id" ON "public"."meal_plans" USING "btree" ("food_master_id");



CREATE INDEX "idx_meal_plans_recipe_id" ON "public"."meal_plans" USING "btree" ("recipe_id");



CREATE INDEX "idx_meal_plans_set_menu_id" ON "public"."meal_plans" USING "btree" ("set_menu_id");



CREATE INDEX "idx_meal_plans_user_date" ON "public"."meal_plans" USING "btree" ("user_id", "date");



CREATE INDEX "idx_meal_plans_user_date_meal_type" ON "public"."meal_plans" USING "btree" ("user_id", "date", "meal_type");



CREATE INDEX "idx_meals_user_date" ON "public"."meals" USING "btree" ("user_id", "date");



CREATE INDEX "idx_recipe_ingredients_recipe_id" ON "public"."recipe_ingredients" USING "btree" ("recipe_id");



CREATE INDEX "idx_recipes_deleted_at" ON "public"."recipes" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_recipes_user_id" ON "public"."recipes" USING "btree" ("user_id");



CREATE INDEX "idx_set_menu_items_food_master_id" ON "public"."set_menu_items" USING "btree" ("food_master_id");



CREATE INDEX "idx_set_menu_items_recipe_id" ON "public"."set_menu_items" USING "btree" ("recipe_id");



CREATE INDEX "idx_set_menu_items_set_menu_id" ON "public"."set_menu_items" USING "btree" ("set_menu_id");



CREATE INDEX "idx_set_menus_deleted_at" ON "public"."set_menus" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_set_menus_user_id" ON "public"."set_menus" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "set_food_masters_updated_at" BEFORE UPDATE ON "public"."food_masters" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_meal_items_updated_at" BEFORE UPDATE ON "public"."meal_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_meals_updated_at" BEFORE UPDATE ON "public"."meals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_recipes_updated_at" BEFORE UPDATE ON "public"."recipes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_set_menus_updated_at" BEFORE UPDATE ON "public"."set_menus" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



ALTER TABLE ONLY "public"."food_masters"
    ADD CONSTRAINT "food_masters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."meal_item_costs"
    ADD CONSTRAINT "meal_item_costs_meal_item_id_fkey" FOREIGN KEY ("meal_item_id") REFERENCES "public"."meal_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meal_items"
    ADD CONSTRAINT "meal_items_food_master_id_fkey" FOREIGN KEY ("food_master_id") REFERENCES "public"."food_masters"("id");



ALTER TABLE ONLY "public"."meal_items"
    ADD CONSTRAINT "meal_items_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "meal_plans_food_master_id_fkey" FOREIGN KEY ("food_master_id") REFERENCES "public"."food_masters"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "meal_plans_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "meal_plans_set_menu_id_fkey" FOREIGN KEY ("set_menu_id") REFERENCES "public"."set_menus"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meal_plans"
    ADD CONSTRAINT "meal_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meals"
    ADD CONSTRAINT "meals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipe_ingredients"
    ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."set_menu_items"
    ADD CONSTRAINT "set_menu_items_food_master_id_fkey" FOREIGN KEY ("food_master_id") REFERENCES "public"."food_masters"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."set_menu_items"
    ADD CONSTRAINT "set_menu_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."set_menu_items"
    ADD CONSTRAINT "set_menu_items_set_menu_id_fkey" FOREIGN KEY ("set_menu_id") REFERENCES "public"."set_menus"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."set_menus"
    ADD CONSTRAINT "set_menus_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can delete own food masters" ON "public"."food_masters" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own recipe ingredients" ON "public"."recipe_ingredients" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."recipes"
  WHERE (("recipes"."id" = "recipe_ingredients"."recipe_id") AND ("recipes"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can delete own recipes" ON "public"."recipes" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own set menu items" ON "public"."set_menu_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."set_menus"
  WHERE (("set_menus"."id" = "set_menu_items"."set_menu_id") AND ("set_menus"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can delete own set menus" ON "public"."set_menus" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own settings" ON "public"."user_settings" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own food masters" ON "public"."food_masters" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own recipe ingredients" ON "public"."recipe_ingredients" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."recipes"
  WHERE (("recipes"."id" = "recipe_ingredients"."recipe_id") AND ("recipes"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can insert own recipes" ON "public"."recipes" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own set menu items" ON "public"."set_menu_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."set_menus"
  WHERE (("set_menus"."id" = "set_menu_items"."set_menu_id") AND ("set_menus"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can insert own set menus" ON "public"."set_menus" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own settings" ON "public"."user_settings" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can manage their own meal plans" ON "public"."meal_plans" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can select own food masters" ON "public"."food_masters" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can select own recipe ingredients" ON "public"."recipe_ingredients" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."recipes"
  WHERE (("recipes"."id" = "recipe_ingredients"."recipe_id") AND ("recipes"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can select own recipes" ON "public"."recipes" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can select own set menu items" ON "public"."set_menu_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."set_menus"
  WHERE (("set_menus"."id" = "set_menu_items"."set_menu_id") AND ("set_menus"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can select own set menus" ON "public"."set_menus" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own food masters" ON "public"."food_masters" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own recipe ingredients" ON "public"."recipe_ingredients" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."recipes"
  WHERE (("recipes"."id" = "recipe_ingredients"."recipe_id") AND ("recipes"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can update own recipes" ON "public"."recipes" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own set menu items" ON "public"."set_menu_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."set_menus"
  WHERE (("set_menus"."id" = "set_menu_items"."set_menu_id") AND ("set_menus"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can update own set menus" ON "public"."set_menus" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own settings" ON "public"."user_settings" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own settings" ON "public"."user_settings" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."food_masters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meal_item_costs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "meal_item_costs_delete" ON "public"."meal_item_costs" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."meal_items" "mi"
     JOIN "public"."meals" "m" ON (("m"."id" = "mi"."meal_id")))
  WHERE (("mi"."id" = "meal_item_costs"."meal_item_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "meal_item_costs_insert" ON "public"."meal_item_costs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."meal_items" "mi"
     JOIN "public"."meals" "m" ON (("m"."id" = "mi"."meal_id")))
  WHERE (("mi"."id" = "meal_item_costs"."meal_item_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "meal_item_costs_select" ON "public"."meal_item_costs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."meal_items" "mi"
     JOIN "public"."meals" "m" ON (("m"."id" = "mi"."meal_id")))
  WHERE (("mi"."id" = "meal_item_costs"."meal_item_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "meal_item_costs_update" ON "public"."meal_item_costs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."meal_items" "mi"
     JOIN "public"."meals" "m" ON (("m"."id" = "mi"."meal_id")))
  WHERE (("mi"."id" = "meal_item_costs"."meal_item_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."meal_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "meal_items_delete" ON "public"."meal_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."meals"
  WHERE (("meals"."id" = "meal_items"."meal_id") AND ("meals"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "meal_items_insert" ON "public"."meal_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."meals"
  WHERE (("meals"."id" = "meal_items"."meal_id") AND ("meals"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "meal_items_select" ON "public"."meal_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."meals"
  WHERE (("meals"."id" = "meal_items"."meal_id") AND ("meals"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "meal_items_update" ON "public"."meal_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."meals"
  WHERE (("meals"."id" = "meal_items"."meal_id") AND ("meals"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."meal_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "meals_delete" ON "public"."meals" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "meals_insert" ON "public"."meals" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "meals_select" ON "public"."meals" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "meals_update" ON "public"."meals" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."recipe_ingredients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recipes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."set_menu_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."set_menus" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_daily_summary"("p_target_date" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_daily_summary"("p_target_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_daily_summary"("p_target_date" "date") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_daily_summary"("p_target_date" "date") TO "anon";



REVOKE ALL ON FUNCTION "public"."get_weekly_summary"("p_start_date" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_weekly_summary"("p_start_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_weekly_summary"("p_start_date" "date") TO "service_role";
GRANT ALL ON FUNCTION "public"."get_weekly_summary"("p_start_date" "date") TO "anon";



GRANT ALL ON TABLE "public"."meal_items" TO "anon";
GRANT ALL ON TABLE "public"."meal_items" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_items" TO "service_role";



REVOKE ALL ON FUNCTION "public"."register_meal_items"("p_meal_id" "uuid", "p_items" "jsonb") FROM PUBLIC;
-- Not in the dump: production never granted anon on the write RPCs, but
-- replaying CREATE FUNCTION picks up the default privileges that do
REVOKE ALL ON FUNCTION "public"."register_meal_items"("p_meal_id" "uuid", "p_items" "jsonb") FROM "anon";
GRANT ALL ON FUNCTION "public"."register_meal_items"("p_meal_id" "uuid", "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_meal_items"("p_meal_id" "uuid", "p_items" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."register_set_menu_to_meal"("p_set_menu_id" "uuid", "p_meal_id" "uuid") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."register_set_menu_to_meal"("p_set_menu_id" "uuid", "p_meal_id" "uuid") FROM "anon";
GRANT ALL ON FUNCTION "public"."register_set_menu_to_meal"("p_set_menu_id" "uuid", "p_meal_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_set_menu_to_meal"("p_set_menu_id" "uuid", "p_meal_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."save_recipe_with_ingredients"("p_id" "uuid", "p_name" "text", "p_servings" integer, "p_calories" numeric, "p_protein" numeric, "p_fat" numeric, "p_carbs" numeric, "p_notes" "text", "p_ingredients" "jsonb") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."save_recipe_with_ingredients"("p_id" "uuid", "p_name" "text", "p_servings" integer, "p_calories" numeric, "p_protein" numeric, "p_fat" numeric, "p_carbs" numeric, "p_notes" "text", "p_ingredients" "jsonb") FROM "anon";
GRANT ALL ON FUNCTION "public"."save_recipe_with_ingredients"("p_id" "uuid", "p_name" "text", "p_servings" integer, "p_calories" numeric, "p_protein" numeric, "p_fat" numeric, "p_carbs" numeric, "p_notes" "text", "p_ingredients" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_recipe_with_ingredients"("p_id" "uuid", "p_name" "text", "p_servings" integer, "p_calories" numeric, "p_protein" numeric, "p_fat" numeric, "p_carbs" numeric, "p_notes" "text", "p_ingredients" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."save_set_menu_with_items"("p_id" "uuid", "p_name" "text", "p_total_calories" numeric, "p_total_protein" numeric, "p_total_fat" numeric, "p_total_carbs" numeric, "p_total_cost" numeric, "p_items" "jsonb") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."save_set_menu_with_items"("p_id" "uuid", "p_name" "text", "p_total_calories" numeric, "p_total_protein" numeric, "p_total_fat" numeric, "p_total_carbs" numeric, "p_total_cost" numeric, "p_items" "jsonb") FROM "anon";
GRANT ALL ON FUNCTION "public"."save_set_menu_with_items"("p_id" "uuid", "p_name" "text", "p_total_calories" numeric, "p_total_protein" numeric, "p_total_fat" numeric, "p_total_carbs" numeric, "p_total_cost" numeric, "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_set_menu_with_items"("p_id" "uuid", "p_name" "text", "p_total_calories" numeric, "p_total_protein" numeric, "p_total_fat" numeric, "p_total_carbs" numeric, "p_total_cost" numeric, "p_items" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_meals_to_plans"("p_start_date" "date", "p_end_date" "date") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."sync_meals_to_plans"("p_start_date" "date", "p_end_date" "date") FROM "anon";
GRANT ALL ON FUNCTION "public"."sync_meals_to_plans"("p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_meals_to_plans"("p_start_date" "date", "p_end_date" "date") TO "service_role";



REVOKE ALL ON FUNCTION "public"."transfer_meal_to_plan"("p_target_date" "date", "p_meal_type" "text") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."transfer_meal_to_plan"("p_target_date" "date", "p_meal_type" "text") FROM "anon";
GRANT ALL ON FUNCTION "public"."transfer_meal_to_plan"("p_target_date" "date", "p_meal_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."transfer_meal_to_plan"("p_target_date" "date", "p_meal_type" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."transfer_plan_to_meal"("p_target_date" "date", "p_meal_type" "text") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."transfer_plan_to_meal"("p_target_date" "date", "p_meal_type" "text") FROM "anon";
GRANT ALL ON FUNCTION "public"."transfer_plan_to_meal"("p_target_date" "date", "p_meal_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."transfer_plan_to_meal"("p_target_date" "date", "p_meal_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."food_masters" TO "anon";
GRANT ALL ON TABLE "public"."food_masters" TO "authenticated";
GRANT ALL ON TABLE "public"."food_masters" TO "service_role";



GRANT ALL ON TABLE "public"."meal_item_costs" TO "anon";
GRANT ALL ON TABLE "public"."meal_item_costs" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_item_costs" TO "service_role";



GRANT ALL ON TABLE "public"."meal_plans" TO "anon";
GRANT ALL ON TABLE "public"."meal_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_plans" TO "service_role";



GRANT ALL ON TABLE "public"."meals" TO "anon";
GRANT ALL ON TABLE "public"."meals" TO "authenticated";
GRANT ALL ON TABLE "public"."meals" TO "service_role";



GRANT ALL ON TABLE "public"."recipe_ingredients" TO "anon";
GRANT ALL ON TABLE "public"."recipe_ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_ingredients" TO "service_role";



GRANT ALL ON TABLE "public"."recipes" TO "anon";
GRANT ALL ON TABLE "public"."recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."recipes" TO "service_role";



GRANT ALL ON TABLE "public"."set_menu_items" TO "anon";
GRANT ALL ON TABLE "public"."set_menu_items" TO "authenticated";
GRANT ALL ON TABLE "public"."set_menu_items" TO "service_role";



GRANT ALL ON TABLE "public"."set_menus" TO "anon";
GRANT ALL ON TABLE "public"."set_menus" TO "authenticated";
GRANT ALL ON TABLE "public"."set_menus" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







