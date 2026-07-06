BEGIN;

-- Consolidated security/performance hardening, addressing Supabase advisors:
-- 1. Legacy RPCs: SECURITY DEFINER -> INVOKER (RLS applies), pin search_path,
--    and revoke EXECUTE from anon/PUBLIC (authenticated only)
-- 2. RLS initplan: wrap auth.uid() in (select auth.uid()) in every policy so
--    it is evaluated once per query instead of per row
-- 3. Covering indexes for unindexed foreign keys
-- 4. Missing DELETE policy on user_settings (deletes were silent no-ops)

-- ─────────────────────────────────────────────────────────────
-- 1. Functions: INVOKER + pinned search_path + execution grants
-- ─────────────────────────────────────────────────────────────
ALTER FUNCTION public.get_daily_summary(DATE) SECURITY INVOKER SET search_path = public;
ALTER FUNCTION public.get_weekly_summary(DATE) SECURITY INVOKER SET search_path = public;
ALTER FUNCTION public.register_meal_items(UUID, JSONB) SECURITY INVOKER SET search_path = public;
ALTER FUNCTION public.register_set_menu_to_meal(UUID, UUID) SECURITY INVOKER SET search_path = public;
ALTER FUNCTION public.transfer_meal_to_plan(DATE, TEXT) SECURITY INVOKER SET search_path = public;
ALTER FUNCTION public.transfer_plan_to_meal(DATE, TEXT) SECURITY INVOKER SET search_path = public;
-- Trigger function: already INVOKER, only the search_path was mutable
ALTER FUNCTION public.update_updated_at() SET search_path = public;

-- RPCs are for signed-in users only
REVOKE EXECUTE ON FUNCTION public.get_daily_summary(DATE) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_weekly_summary(DATE) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.register_meal_items(UUID, JSONB) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.register_set_menu_to_meal(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.transfer_meal_to_plan(DATE, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.transfer_plan_to_meal(DATE, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.save_recipe_with_ingredients(UUID, TEXT, INTEGER, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, JSONB) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.save_set_menu_with_items(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sync_meals_to_plans(DATE, DATE) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_daily_summary(DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_weekly_summary(DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_meal_items(UUID, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_set_menu_to_meal(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.transfer_meal_to_plan(DATE, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.transfer_plan_to_meal(DATE, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.save_recipe_with_ingredients(UUID, TEXT, INTEGER, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.save_set_menu_with_items(UUID, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_meals_to_plans(DATE, DATE) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────
-- 2. RLS policies: evaluate auth.uid() once per query
-- ─────────────────────────────────────────────────────────────
-- meals
ALTER POLICY meals_select ON public.meals USING ((select auth.uid()) = user_id);
ALTER POLICY meals_insert ON public.meals WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY meals_update ON public.meals USING ((select auth.uid()) = user_id);
ALTER POLICY meals_delete ON public.meals USING ((select auth.uid()) = user_id);

-- meal_items (ownership via parent meal)
ALTER POLICY meal_items_select ON public.meal_items
  USING (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = (select auth.uid())));
ALTER POLICY meal_items_insert ON public.meal_items
  WITH CHECK (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = (select auth.uid())));
ALTER POLICY meal_items_update ON public.meal_items
  USING (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = (select auth.uid())));
ALTER POLICY meal_items_delete ON public.meal_items
  USING (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = (select auth.uid())));

-- meal_item_costs (ownership via meal_items -> meals)
ALTER POLICY meal_item_costs_select ON public.meal_item_costs
  USING (EXISTS (SELECT 1 FROM meal_items mi JOIN meals m ON m.id = mi.meal_id
                 WHERE mi.id = meal_item_costs.meal_item_id AND m.user_id = (select auth.uid())));
ALTER POLICY meal_item_costs_insert ON public.meal_item_costs
  WITH CHECK (EXISTS (SELECT 1 FROM meal_items mi JOIN meals m ON m.id = mi.meal_id
                      WHERE mi.id = meal_item_costs.meal_item_id AND m.user_id = (select auth.uid())));
ALTER POLICY meal_item_costs_update ON public.meal_item_costs
  USING (EXISTS (SELECT 1 FROM meal_items mi JOIN meals m ON m.id = mi.meal_id
                 WHERE mi.id = meal_item_costs.meal_item_id AND m.user_id = (select auth.uid())));
ALTER POLICY meal_item_costs_delete ON public.meal_item_costs
  USING (EXISTS (SELECT 1 FROM meal_items mi JOIN meals m ON m.id = mi.meal_id
                 WHERE mi.id = meal_item_costs.meal_item_id AND m.user_id = (select auth.uid())));

-- meal_plans
ALTER POLICY "Users can manage their own meal plans" ON public.meal_plans
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- food_masters
ALTER POLICY "Users can select own food masters" ON public.food_masters USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert own food masters" ON public.food_masters WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own food masters" ON public.food_masters
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete own food masters" ON public.food_masters USING ((select auth.uid()) = user_id);

-- recipes
ALTER POLICY "Users can select own recipes" ON public.recipes USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert own recipes" ON public.recipes WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own recipes" ON public.recipes
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete own recipes" ON public.recipes USING ((select auth.uid()) = user_id);

-- recipe_ingredients (ownership via parent recipe)
ALTER POLICY "Users can select own recipe ingredients" ON public.recipe_ingredients
  USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = (select auth.uid())));
ALTER POLICY "Users can insert own recipe ingredients" ON public.recipe_ingredients
  WITH CHECK (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = (select auth.uid())));
ALTER POLICY "Users can update own recipe ingredients" ON public.recipe_ingredients
  USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = (select auth.uid())));
ALTER POLICY "Users can delete own recipe ingredients" ON public.recipe_ingredients
  USING (EXISTS (SELECT 1 FROM recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = (select auth.uid())));

-- set_menus
ALTER POLICY "Users can select own set menus" ON public.set_menus USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert own set menus" ON public.set_menus WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own set menus" ON public.set_menus
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete own set menus" ON public.set_menus USING ((select auth.uid()) = user_id);

-- set_menu_items (ownership via parent set menu)
ALTER POLICY "Users can select own set menu items" ON public.set_menu_items
  USING (EXISTS (SELECT 1 FROM set_menus WHERE set_menus.id = set_menu_items.set_menu_id AND set_menus.user_id = (select auth.uid())));
ALTER POLICY "Users can insert own set menu items" ON public.set_menu_items
  WITH CHECK (EXISTS (SELECT 1 FROM set_menus WHERE set_menus.id = set_menu_items.set_menu_id AND set_menus.user_id = (select auth.uid())));
ALTER POLICY "Users can update own set menu items" ON public.set_menu_items
  USING (EXISTS (SELECT 1 FROM set_menus WHERE set_menus.id = set_menu_items.set_menu_id AND set_menus.user_id = (select auth.uid())));
ALTER POLICY "Users can delete own set menu items" ON public.set_menu_items
  USING (EXISTS (SELECT 1 FROM set_menus WHERE set_menus.id = set_menu_items.set_menu_id AND set_menus.user_id = (select auth.uid())));

-- user_settings
ALTER POLICY "Users can view own settings" ON public.user_settings USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert own settings" ON public.user_settings WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own settings" ON public.user_settings
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- ─────────────────────────────────────────────────────────────
-- 3. Covering indexes for foreign keys
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_meal_items_food_master_id ON public.meal_items (food_master_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_food_master_id ON public.meal_plans (food_master_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_recipe_id ON public.meal_plans (recipe_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_set_menu_id ON public.meal_plans (set_menu_id);
CREATE INDEX IF NOT EXISTS idx_set_menu_items_food_master_id ON public.set_menu_items (food_master_id);
CREATE INDEX IF NOT EXISTS idx_set_menu_items_recipe_id ON public.set_menu_items (recipe_id);

-- ─────────────────────────────────────────────────────────────
-- 4. user_settings: allow owners to delete their row
--    (deletes previously matched no policy and silently affected 0 rows)
-- ─────────────────────────────────────────────────────────────
CREATE POLICY "Users can delete own settings" ON public.user_settings
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Functional + structural assertions (impersonating the e2e user)
DO $test$
DECLARE
  v_uid UUID;
  v_cnt INT;
  v_meal_id UUID;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'e2e-playwright@example.com';
  IF v_uid IS NULL THEN RAISE EXCEPTION 'e2e user missing'; END IF;

  -- Structural: functions are INVOKER now
  SELECT count(*) INTO v_cnt FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prosecdef
    AND p.proname IN ('get_daily_summary','get_weekly_summary','register_meal_items',
                      'register_set_menu_to_meal','transfer_meal_to_plan','transfer_plan_to_meal');
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'still % SECURITY DEFINER functions', v_cnt; END IF;

  -- Structural: search_path pinned on all 7
  SELECT count(*) INTO v_cnt FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('get_daily_summary','get_weekly_summary','register_meal_items',
                      'register_set_menu_to_meal','transfer_meal_to_plan','transfer_plan_to_meal','update_updated_at')
    AND (p.proconfig IS NULL OR NOT EXISTS (
      SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%'));
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'still % functions with mutable search_path', v_cnt; END IF;

  -- Structural: anon cannot execute, authenticated can
  IF has_function_privilege('anon', 'public.get_daily_summary(date)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon can still execute get_daily_summary';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.register_meal_items(uuid, jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated lost execute on register_meal_items';
  END IF;

  -- Structural: no policy evaluates bare auth.uid() anymore
  SELECT count(*) INTO v_cnt FROM pg_policies
  WHERE schemaname = 'public'
    AND (COALESCE(qual,'') || COALESCE(with_check,'')) LIKE '%auth.uid()%'
    AND (COALESCE(qual,'') || COALESCE(with_check,'')) NOT LIKE '%( SELECT auth.uid()%';
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'still % policies with per-row auth.uid()', v_cnt; END IF;

  -- Structural: indexes exist
  SELECT count(*) INTO v_cnt FROM pg_indexes WHERE schemaname = 'public' AND indexname IN (
    'idx_meal_items_food_master_id','idx_meal_plans_food_master_id','idx_meal_plans_recipe_id',
    'idx_meal_plans_set_menu_id','idx_set_menu_items_food_master_id','idx_set_menu_items_recipe_id');
  IF v_cnt <> 6 THEN RAISE EXCEPTION 'expected 6 fk indexes, got %', v_cnt; END IF;

  -- Functional under INVOKER + rewritten RLS (impersonate the user)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  -- Summary RPC returns without error
  PERFORM * FROM get_daily_summary(CURRENT_DATE);
  PERFORM * FROM get_weekly_summary(CURRENT_DATE);

  -- Write path: register an item through the RPC
  INSERT INTO meals (user_id, date, meal_type) VALUES (v_uid, '2099-01-01', 'lunch')
  ON CONFLICT (user_id, date, meal_type) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_meal_id;
  PERFORM register_meal_items(v_meal_id,
    '[{"name":"検証品","calories":100,"protein":1,"fat":1,"carbs":1,"cost":null,"source_type":"manual","food_master_id":null,"recipe_id":null,"set_menu_id":null}]'::jsonb);
  SELECT count(*) INTO v_cnt FROM meal_items WHERE meal_id = v_meal_id;
  IF v_cnt <> 1 THEN RAISE EXCEPTION 'register_meal_items under INVOKER failed'; END IF;

  -- user_settings can now be deleted by its owner
  INSERT INTO user_settings (user_id, target_calories) VALUES (v_uid, 1234)
  ON CONFLICT (user_id) DO UPDATE SET target_calories = 1234;
  DELETE FROM user_settings WHERE user_id = v_uid;
  SELECT count(*) INTO v_cnt FROM user_settings WHERE user_id = v_uid;
  IF v_cnt <> 0 THEN RAISE EXCEPTION 'user_settings delete still blocked'; END IF;

  RESET ROLE;
  RAISE NOTICE 'ALL ASSERTIONS PASSED';
END;
$test$;

ROLLBACK;
