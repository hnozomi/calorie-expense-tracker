import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import { SCREEN_CACHE } from "@/lib/screen-cache";
import { createClient } from "@/lib/supabase/server";
import type { DbDailySummaryRow, MealType, SourceType } from "@/types";
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

// The Supabase client has no generated types, so rows arrive untyped; the casts follow the table definitions in supabase/migrations
const RECENT_FETCH_LIMIT = 100;
const RECENT_DISPLAY_LIMIT = 20;

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

// Items linked to a master show the master's current values, so fixing a master fixes past days too
export const getDailyMeals = async (date: string): Promise<DailyMealGroup> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meals")
    .select("id, meal_type, meal_items(*)")
    .eq("date", date)
    .order("created_at", { ascending: true })
    // Items in a slot keep the order they were registered in, as the optimistic list appends them
    .order("sort_order", { referencedTable: "meal_items", ascending: true });
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
    (row: DbDailySummaryRow): DailySummaryRow => ({
      // meal_type is a check-constrained text column holding one of MEAL_TYPES
      mealType: row.meal_type as MealType,
      calories: row.total_calories,
      protein: row.total_protein,
      fat: row.total_fat,
      carbs: row.total_carbs,
      totalCost: row.total_cost,
      itemCount: row.item_count,
    }),
  );
};

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
