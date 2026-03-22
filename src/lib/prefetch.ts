import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import type { MealType } from "@/types";

/** Prefetch daily meals grouped by meal_type for a given date */
export const prefetchDailyMeals = (
  queryClient: QueryClient,
  supabase: SupabaseClient,
  date: string,
) =>
  queryClient.prefetchQuery({
    queryKey: queryKeys.meals.daily(date),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select("id, meal_type, meal_items(*)")
        .eq("date", date)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const grouped: Record<
        MealType,
        { mealId: string | null; items: unknown[] }
      > = {
        breakfast: { mealId: null, items: [] },
        lunch: { mealId: null, items: [] },
        dinner: { mealId: null, items: [] },
        snack: { mealId: null, items: [] },
      };

      for (const meal of data ?? []) {
        const mealType = meal.meal_type as MealType;
        grouped[mealType] = {
          mealId: meal.id,
          items: ((meal.meal_items as Record<string, unknown>[]) ?? []).map(
            (item) => ({
              id: item.id as string,
              mealId: item.meal_id as string,
              name: item.name as string,
              calories: item.calories as number,
              protein: item.protein as number,
              fat: item.fat as number,
              carbs: item.carbs as number,
              cost: item.cost as number | null,
              sourceType: item.source_type as string,
              recipeId: item.recipe_id as string | null,
              foodMasterId: item.food_master_id as string | null,
              setMenuId: item.set_menu_id as string | null,
              servingQuantity: item.serving_quantity as number,
              sortOrder: item.sort_order as number,
              createdAt: item.created_at as string,
              updatedAt: item.updated_at as string,
            }),
          ),
        };
      }

      return grouped;
    },
  });

/** Prefetch daily summary (calories/PFC/cost per meal_type) via RPC */
export const prefetchDailySummary = (
  queryClient: QueryClient,
  supabase: SupabaseClient,
  date: string,
) =>
  queryClient.prefetchQuery({
    queryKey: queryKeys.meals.summary(date),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_daily_summary", {
        p_target_date: date,
      });

      if (error) throw error;

      return (data ?? []).map((row: Record<string, unknown>) => ({
        mealType: row.meal_type as MealType,
        calories: row.total_calories as number,
        protein: row.total_protein as number,
        fat: row.total_fat as number,
        carbs: row.total_carbs as number,
        totalCost: row.total_cost as number,
        itemCount: row.item_count as number,
      }));
    },
  });

/** Prefetch nutrition target settings */
export const prefetchNutritionTarget = (
  queryClient: QueryClient,
  supabase: SupabaseClient,
) =>
  queryClient.prefetchQuery({
    queryKey: queryKeys.settings.nutritionTarget(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return {
          targetCalories: 2000,
          targetProtein: 60,
          targetFat: 55,
          targetCarbs: 300,
        };
      }

      return {
        id: data.id,
        userId: data.user_id,
        targetCalories: Number(data.target_calories),
        targetProtein: Number(data.target_protein),
        targetFat: Number(data.target_fat),
        targetCarbs: Number(data.target_carbs),
      };
    },
  });

/** Prefetch recipes list */
export const prefetchRecipes = (
  queryClient: QueryClient,
  supabase: SupabaseClient,
  search?: string,
) =>
  queryClient.prefetchQuery({
    queryKey: queryKeys.recipes.list(search),
    queryFn: async () => {
      let query = supabase
        .from("recipes")
        .select("*, recipe_ingredients(*)")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });

      if (search && search.trim().length > 0) {
        query = query.ilike("name", `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        servings: row.servings,
        calories: Number(row.calories),
        protein: Number(row.protein),
        fat: Number(row.fat),
        carbs: Number(row.carbs),
        notes: row.notes,
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ingredients: (row.recipe_ingredients ?? []).map(
          (ing: Record<string, unknown>) => ({
            id: ing.id as string,
            recipeId: ing.recipe_id as string,
            ingredientName: ing.ingredient_name as string,
            quantity: Number(ing.quantity),
            unit: ing.unit as string,
            unitPrice: Number(ing.unit_price),
          }),
        ),
      }));
    },
  });

/** Prefetch a single recipe detail */
export const prefetchRecipeDetail = (
  queryClient: QueryClient,
  supabase: SupabaseClient,
  id: string,
) =>
  queryClient.prefetchQuery({
    queryKey: queryKeys.recipes.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*, recipe_ingredients(*)")
        .eq("id", id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        servings: data.servings,
        calories: Number(data.calories),
        protein: Number(data.protein),
        fat: Number(data.fat),
        carbs: Number(data.carbs),
        notes: data.notes,
        deletedAt: data.deleted_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        ingredients: (data.recipe_ingredients ?? []).map(
          (ing: Record<string, unknown>) => ({
            id: ing.id as string,
            recipeId: ing.recipe_id as string,
            ingredientName: ing.ingredient_name as string,
            quantity: Number(ing.quantity),
            unit: ing.unit as string,
            unitPrice: Number(ing.unit_price),
          }),
        ),
      };
    },
  });

/** Prefetch food masters list */
export const prefetchFoodMasters = (
  queryClient: QueryClient,
  supabase: SupabaseClient,
  search?: string,
) =>
  queryClient.prefetchQuery({
    queryKey: queryKeys.foodMasters.list(search),
    queryFn: async () => {
      let query = supabase
        .from("food_masters")
        .select("*")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });

      if (search && search.trim().length > 0) {
        query = query.ilike("name", `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        brand: row.brand,
        category: row.category,
        calories: Number(row.calories),
        protein: Number(row.protein),
        fat: Number(row.fat),
        carbs: Number(row.carbs),
        defaultPrice: row.default_price ? Number(row.default_price) : null,
        notes: row.notes,
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
  });

/** Prefetch a single food master detail */
export const prefetchFoodMasterDetail = (
  queryClient: QueryClient,
  supabase: SupabaseClient,
  id: string,
) =>
  queryClient.prefetchQuery({
    queryKey: queryKeys.foodMasters.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_masters")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        brand: data.brand,
        category: data.category,
        calories: Number(data.calories),
        protein: Number(data.protein),
        fat: Number(data.fat),
        carbs: Number(data.carbs),
        defaultPrice: data.default_price ? Number(data.default_price) : null,
        notes: data.notes,
        deletedAt: data.deleted_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
  });

/** Prefetch meal plans for a given week */
export const prefetchMealPlans = (
  queryClient: QueryClient,
  supabase: SupabaseClient,
  weekStart: string,
  weekEnd: string,
) =>
  queryClient.prefetchQuery({
    queryKey: queryKeys.plans.weekly(weekStart),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .gte("date", weekStart)
        .lte("date", weekEnd)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        date: row.date,
        mealType: row.meal_type as MealType,
        plannedName: row.planned_name,
        recipeId: row.recipe_id,
        foodMasterId: row.food_master_id,
        setMenuId: row.set_menu_id,
        calories: Number(row.calories),
        protein: Number(row.protein),
        fat: Number(row.fat),
        carbs: Number(row.carbs),
        estimatedCost: Number(row.estimated_cost),
        isTransferred: row.is_transferred,
        createdAt: row.created_at,
      }));
    },
  });

/** Prefetch set menus list */
export const prefetchSetMenus = (
  queryClient: QueryClient,
  supabase: SupabaseClient,
) =>
  queryClient.prefetchQuery({
    queryKey: queryKeys.setMenus.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("set_menus")
        .select("*, set_menu_items(*)")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        totalCalories: Number(row.total_calories),
        totalProtein: Number(row.total_protein),
        totalFat: Number(row.total_fat),
        totalCarbs: Number(row.total_carbs),
        totalCost: Number(row.total_cost),
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        items: (row.set_menu_items ?? []).map(
          (item: Record<string, unknown>) => ({
            id: item.id as string,
            setMenuId: item.set_menu_id as string,
            name: item.name as string,
            recipeId: (item.recipe_id as string) ?? null,
            foodMasterId: (item.food_master_id as string) ?? null,
            calories: Number(item.calories),
            protein: Number(item.protein),
            fat: Number(item.fat),
            carbs: Number(item.carbs),
            cost: Number(item.cost),
            servingQuantity: Number(item.serving_quantity),
            sortOrder: Number(item.sort_order),
          }),
        ),
      }));
    },
  });

/** Prefetch weekly report via RPC */
export const prefetchWeeklyReport = (
  queryClient: QueryClient,
  supabase: SupabaseClient,
  weekStart: string,
) =>
  queryClient.prefetchQuery({
    queryKey: queryKeys.report.weekly(weekStart),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_weekly_summary", {
        p_start_date: weekStart,
      });
      if (error) throw error;

      const entries = (
        data as {
          date: string;
          total_calories: number;
          total_protein: number;
          total_fat: number;
          total_carbs: number;
          total_cost: number;
        }[]
      ).map((row) => ({
        date: row.date,
        calories: Number(row.total_calories),
        protein: Number(row.total_protein),
        fat: Number(row.total_fat),
        carbs: Number(row.total_carbs),
        totalCost: Number(row.total_cost),
      }));

      const daysWithData = entries.filter((e) => e.calories > 0).length;
      const divisor = Math.max(daysWithData, 1);

      const totals = entries.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          protein: acc.protein + e.protein,
          fat: acc.fat + e.fat,
          carbs: acc.carbs + e.carbs,
          cost: acc.cost + e.totalCost,
        }),
        { calories: 0, protein: 0, fat: 0, carbs: 0, cost: 0 },
      );

      return {
        weekStart,
        entries,
        averageCalories: totals.calories / divisor,
        averageProtein: totals.protein / divisor,
        averageFat: totals.fat / divisor,
        averageCarbs: totals.carbs / divisor,
        averageCost: totals.cost / divisor,
        totalCost: totals.cost,
      };
    },
  });
