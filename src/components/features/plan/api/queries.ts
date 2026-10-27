import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import { SCREEN_CACHE } from "@/lib/screen-cache";
import { createClient } from "@/lib/supabase/server";
import { shiftDate } from "@/utils";
import type { MealPlan } from "../types/meal-plan";
import {
  collectPlanMasterIds,
  type MasterRow,
  toMealPlan,
} from "../utils/meal-plan-rows";

const fetchPlanMasters = async (
  supabase: SupabaseClient,
  rows: Record<string, unknown>[],
) => {
  const { foodMasterIds, recipeIds } = collectPlanMasterIds(rows);
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

export const getWeeklyMealPlans = async (
  weekStart: string,
): Promise<MealPlan[]> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meal_plans")
    .select("*")
    .gte("date", weekStart)
    .lte("date", shiftDate(weekStart, 6))
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as Record<string, unknown>[]; // untyped client, see meal-plan-rows.ts
  const { foodMasterMap, recipeMap } = await fetchPlanMasters(supabase, rows);
  return rows.map((row) => toMealPlan(row, foodMasterMap, recipeMap));
};
