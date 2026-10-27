import type { MealType } from "@/types";
import type { MealPlan } from "../types/meal-plan";

// The Supabase client has no generated types, so rows arrive untyped; the casts follow the table definitions in supabase/migrations
export type MasterRow = Record<string, unknown>;

/** Master ids the plans point at, to read them in one query each */
export const collectPlanMasterIds = (rows: Record<string, unknown>[]) => {
  const foodMasterIds = new Set<string>();
  const recipeIds = new Set<string>();
  for (const row of rows) {
    if (row.food_master_id) foodMasterIds.add(row.food_master_id as string);
    if (row.recipe_id) recipeIds.add(row.recipe_id as string);
  }
  return { foodMasterIds, recipeIds };
};

// A plan linked to a master shows the master's current values, like meal items do
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

export const toMealPlan = (
  row: Record<string, unknown>,
  foodMasterMap: Map<string, MasterRow>,
  recipeMap: Map<string, MasterRow>,
): MealPlan => ({
  id: row.id as string,
  userId: row.user_id as string,
  date: row.date as string,
  mealType: row.meal_type as MealType,
  recipeId: row.recipe_id as string | null,
  foodMasterId: row.food_master_id as string | null,
  setMenuId: row.set_menu_id as string | null,
  isTransferred: row.is_transferred as boolean,
  createdAt: row.created_at as string,
  ...resolvePlanNutrition(
    row,
    foodMasterMap.get(row.food_master_id as string),
    recipeMap.get(row.recipe_id as string),
  ),
});
