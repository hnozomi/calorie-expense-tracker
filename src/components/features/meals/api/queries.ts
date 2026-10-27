import type { SupabaseClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import { SCREEN_CACHE } from "@/lib/screen-cache";
import { createClient } from "@/lib/supabase/server";
import type { MealType, SourceType } from "@/types";
import type { DailyMealGroup, DailySummaryRow } from "../types/meal";
import {
  collectMasterIds,
  groupDailyMeals,
  type MasterRow,
} from "../utils/meal-item-rows";
import {
  dedupeRecentItemsByName,
  type RecentMealItem,
} from "../utils/recent-meal-items";

const RECENT_FETCH_LIMIT = 100;
const RECENT_DISPLAY_LIMIT = 20;

/** Batch-fetch food masters and recipes, returning lookup maps */
const fetchMasters = async (
  supabase: SupabaseClient,
  foodMasterIds: Set<string>,
  recipeIds: Set<string>,
) => {
  const foodMasterMap = new Map<string, MasterRow>();
  const recipeMap = new Map<string, MasterRow>();

  const promises: PromiseLike<void>[] = [];

  if (foodMasterIds.size > 0) {
    promises.push(
      supabase
        .from("food_masters")
        .select(
          "id, name, calories, protein, fat, carbs, default_price, deleted_at",
        )
        .in("id", [...foodMasterIds])
        .then(({ data }) => {
          for (const row of data ?? []) {
            foodMasterMap.set(row.id, row as MasterRow);
          }
        }),
    );
  }

  if (recipeIds.size > 0) {
    promises.push(
      supabase
        .from("recipes")
        .select("id, name, calories, protein, fat, carbs, servings, deleted_at")
        .in("id", [...recipeIds])
        .then(({ data }) => {
          for (const row of data ?? []) {
            recipeMap.set(row.id, row as MasterRow);
          }
        }),
    );
  }

  await Promise.all(promises);
  return { foodMasterMap, recipeMap };
};

/** A day's meals by slot, with master-linked items showing the master's current values */
export const getDailyMeals = async (date: string): Promise<DailyMealGroup> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meals")
    .select("id, meal_type, meal_items(*)")
    .eq("date", date)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const meals = data ?? [];
  const { foodMasterIds, recipeIds } = collectMasterIds(
    meals.flatMap(
      (meal) => (meal.meal_items as Record<string, unknown>[]) ?? [],
    ),
  );
  const { foodMasterMap, recipeMap } = await fetchMasters(
    supabase,
    foodMasterIds,
    recipeIds,
  );
  return groupDailyMeals(meals, foodMasterMap, recipeMap);
};

/** Calories, PFC and cost per slot for a day (get_daily_summary RPC) */
export const getDailySummary = async (
  date: string,
): Promise<DailySummaryRow[]> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  const supabase = await createClient();
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
};

/** Recently registered items, newest first and one per name, for one-tap re-adding */
export const getRecentMealItems = async (): Promise<RecentMealItem[]> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meal_items")
    .select(
      "name, calories, protein, fat, carbs, cost, source_type, recipe_id, food_master_id, set_menu_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(RECENT_FETCH_LIMIT);
  if (error) throw error;

  const items: RecentMealItem[] = (data ?? []).map((row) => ({
    name: row.name,
    calories: Number(row.calories),
    protein: Number(row.protein),
    fat: Number(row.fat),
    carbs: Number(row.carbs),
    cost: row.cost === null ? null : Number(row.cost),
    sourceType: row.source_type as SourceType,
    recipeId: row.recipe_id,
    foodMasterId: row.food_master_id,
    setMenuId: row.set_menu_id,
  }));
  return dedupeRecentItemsByName(items, RECENT_DISPLAY_LIMIT);
};
