import type { SupabaseClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import type { MealType } from "@/types";
import type { DailySummaryRow, MealItem } from "./types/meal";

type DailyMealGroup = Record<MealType, { mealId: string | null; items: MealItem[] }>;

const createEmptyDailyMeals = (): DailyMealGroup => ({
  breakfast: { mealId: null, items: [] },
  lunch: { mealId: null, items: [] },
  dinner: { mealId: null, items: [] },
  snack: { mealId: null, items: [] },
});

const mapMealItem = (item: Record<string, unknown>): MealItem => ({
  id: item.id as string,
  mealId: item.meal_id as string,
  name: item.name as string,
  calories: item.calories as number,
  protein: item.protein as number,
  fat: item.fat as number,
  carbs: item.carbs as number,
  cost: item.cost as number | null,
  sourceType: item.source_type as MealItem["sourceType"],
  recipeId: item.recipe_id as string | null,
  foodMasterId: item.food_master_id as string | null,
  setMenuId: item.set_menu_id as string | null,
  servingQuantity: item.serving_quantity as number,
  sortOrder: item.sort_order as number,
  createdAt: item.created_at as string,
  updatedAt: item.updated_at as string,
});

export const getDailyMealsQueryOptions = (
  supabase: SupabaseClient,
  date: string,
) =>
  queryOptions({
    queryKey: queryKeys.meals.daily(date),
    queryFn: async (): Promise<DailyMealGroup> => {
      const { data, error } = await supabase
        .from("meals")
        .select("id, meal_type, meal_items(*)")
        .eq("date", date)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const grouped = createEmptyDailyMeals();

      for (const meal of data ?? []) {
        const mealType = meal.meal_type as MealType;
        grouped[mealType] = {
          mealId: meal.id,
          items: ((meal.meal_items as Record<string, unknown>[]) ?? []).map(
            mapMealItem,
          ),
        };
      }

      return grouped;
    },
  });

export const getDailySummaryQueryOptions = (
  supabase: SupabaseClient,
  date: string,
) =>
  queryOptions({
    queryKey: queryKeys.meals.summary(date),
    queryFn: async (): Promise<DailySummaryRow[]> => {
      const { data, error } = await supabase.rpc("get_daily_summary", {
        p_target_date: date,
      });

      if (error) throw error;

      return (data ?? []).map(
        (row: Record<string, unknown>): DailySummaryRow => ({
          mealType: row.meal_type as MealType,
          calories: row.total_calories as number,
          protein: row.total_protein as number,
          fat: row.total_fat as number,
          carbs: row.total_carbs as number,
          totalCost: row.total_cost as number,
          itemCount: row.item_count as number,
        }),
      );
    },
  });
