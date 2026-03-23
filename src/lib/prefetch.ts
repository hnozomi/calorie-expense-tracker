import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/react-query";
import {
  getDailyMealsQueryOptions,
  getDailySummaryQueryOptions,
} from "@/components/features/meals/queries";
import { getMealPlansQueryOptions } from "@/components/features/plan/queries";
import { getWeeklyReportQueryOptions } from "@/components/features/report/queries";
import { getNutritionTargetQueryOptions } from "@/components/features/settings/queries";
import { queryKeys } from "@/hooks/query-keys";
import type { MealType } from "@/types";

/** Prefetch daily meals grouped by meal_type for a given date */
export const prefetchDailyMeals = (
  queryClient: QueryClient,
  supabase: SupabaseClient,
  date: string,
) =>
  queryClient.prefetchQuery(getDailyMealsQueryOptions(supabase, date));

/** Prefetch daily summary (calories/PFC/cost per meal_type) via RPC */
export const prefetchDailySummary = (
  queryClient: QueryClient,
  supabase: SupabaseClient,
  date: string,
) =>
  queryClient.prefetchQuery(getDailySummaryQueryOptions(supabase, date));

/** Prefetch nutrition target settings */
export const prefetchNutritionTarget = (
  queryClient: QueryClient,
  supabase: SupabaseClient,
) =>
  queryClient.prefetchQuery(getNutritionTargetQueryOptions(supabase));

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
) =>
  queryClient.prefetchQuery(getMealPlansQueryOptions(supabase, weekStart));

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
  queryClient.prefetchQuery(getWeeklyReportQueryOptions(supabase, weekStart));
