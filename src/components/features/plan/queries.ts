import type { SupabaseClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import type { MealType } from "@/types";
import { shiftDate } from "@/utils";
import type { MealPlan } from "./types/meal-plan";

type MasterRow = Record<string, unknown>;

/** Batch-fetch food masters and recipes for plan items */
const fetchPlanMasters = async (
  supabase: SupabaseClient,
  rows: Record<string, unknown>[],
) => {
  const foodMasterIds = new Set<string>();
  const recipeIds = new Set<string>();

  for (const row of rows) {
    if (row.food_master_id) foodMasterIds.add(row.food_master_id as string);
    if (row.recipe_id) recipeIds.add(row.recipe_id as string);
  }

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

/** Resolve nutrition values from master data for a meal plan */
const resolvePlanNutrition = (
  row: Record<string, unknown>,
  foodMaster: MasterRow | undefined,
  recipe: MasterRow | undefined,
) => {
  if (row.food_master_id && foodMaster && !foodMaster.deleted_at) {
    return {
      plannedName: foodMaster.name as string,
      calories: Number(foodMaster.calories),
      protein: Number(foodMaster.protein),
      fat: Number(foodMaster.fat),
      carbs: Number(foodMaster.carbs),
      estimatedCost: Number(foodMaster.default_price ?? 0),
    };
  }

  if (row.recipe_id && recipe && !recipe.deleted_at) {
    const servings = Math.max(Number(recipe.servings) || 1, 1);
    return {
      plannedName: recipe.name as string,
      calories: Number(recipe.calories) / servings,
      protein: Number(recipe.protein) / servings,
      fat: Number(recipe.fat) / servings,
      carbs: Number(recipe.carbs) / servings,
      estimatedCost: Number(row.estimated_cost),
    };
  }

  return {
    plannedName: row.planned_name as string,
    calories: Number(row.calories),
    protein: Number(row.protein),
    fat: Number(row.fat),
    carbs: Number(row.carbs),
    estimatedCost: Number(row.estimated_cost),
  };
};

export const getMealPlansQueryOptions = (
  supabase: SupabaseClient,
  weekStart: string,
) => {
  const weekEnd = shiftDate(weekStart, 6);

  return queryOptions({
    queryKey: queryKeys.plans.weekly(weekStart),
    queryFn: async (): Promise<MealPlan[]> => {
      const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .gte("date", weekStart)
        .lte("date", weekEnd)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as Record<string, unknown>[];
      const { foodMasterMap, recipeMap } = await fetchPlanMasters(
        supabase,
        rows,
      );

      return rows.map((row): MealPlan => {
        const foodMaster = foodMasterMap.get(row.food_master_id as string);
        const recipe = recipeMap.get(row.recipe_id as string);
        const resolved = resolvePlanNutrition(row, foodMaster, recipe);

        return {
          id: row.id as string,
          userId: row.user_id as string,
          date: row.date as string,
          mealType: row.meal_type as MealType,
          recipeId: row.recipe_id as string | null,
          foodMasterId: row.food_master_id as string | null,
          setMenuId: row.set_menu_id as string | null,
          isTransferred: row.is_transferred as boolean,
          createdAt: row.created_at as string,
          ...resolved,
        };
      });
    },
  });
};
