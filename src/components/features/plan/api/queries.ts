import "server-only";
import { cacheLife } from "next/cache";
import type { MealPlan } from "@/components/features/plan/types/meal-plan";
import {
  collectPlanMasterIds,
  toMealPlan,
} from "@/components/features/plan/utils/meal-plan-rows";
import { fetchMasters } from "@/lib/fetch-masters";
import { SCREEN_CACHE } from "@/lib/screen-cache";
import { createClient } from "@/lib/supabase/server";
import { shiftDate } from "@/utils";

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

  const rows = data ?? [];
  const { foodMasterIds, recipeIds } = collectPlanMasterIds(rows);
  const { foodMasterMap, recipeMap } = await fetchMasters(
    supabase,
    foodMasterIds,
    recipeIds,
  );
  return rows.map((row) => toMealPlan(row, foodMasterMap, recipeMap));
};
