import type { MealPlan } from "@/components/features/plan/types/meal-plan";
import type { Tables } from "@/lib/supabase/database.types";
import type {
  FoodMasterNutritionRow,
  MealType,
  RecipeNutritionRow,
} from "@/types";

type MealPlanRow = Tables<"meal_plans">;

/** Master ids the plans point at, to read them in one query each */
export const collectPlanMasterIds = (
  rows: Pick<MealPlanRow, "food_master_id" | "recipe_id">[],
) => {
  const foodMasterIds = new Set<string>();
  const recipeIds = new Set<string>();
  for (const row of rows) {
    if (row.food_master_id) foodMasterIds.add(row.food_master_id);
    if (row.recipe_id) recipeIds.add(row.recipe_id);
  }
  return { foodMasterIds, recipeIds };
};

// A plan linked to a master shows the master's current values, like meal items do
const resolvePlanNutrition = (
  row: MealPlanRow,
  foodMaster: FoodMasterNutritionRow | undefined,
  recipe: RecipeNutritionRow | undefined,
) => {
  if (row.food_master_id && foodMaster && !foodMaster.deleted_at) {
    return {
      plannedName: foodMaster.name,
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
      plannedName: recipe.name,
      calories: Number(recipe.calories) / servings,
      protein: Number(recipe.protein) / servings,
      fat: Number(recipe.fat) / servings,
      carbs: Number(recipe.carbs) / servings,
      estimatedCost: Number(row.estimated_cost),
    };
  }

  return {
    plannedName: row.planned_name,
    calories: Number(row.calories),
    protein: Number(row.protein),
    fat: Number(row.fat),
    carbs: Number(row.carbs),
    estimatedCost: Number(row.estimated_cost),
  };
};

export const toMealPlan = (
  row: MealPlanRow,
  foodMasterMap: Map<string, FoodMasterNutritionRow>,
  recipeMap: Map<string, RecipeNutritionRow>,
): MealPlan => ({
  id: row.id,
  userId: row.user_id,
  date: row.date,
  // meal_type is a check-constrained text column holding one of MEAL_TYPES
  mealType: row.meal_type as MealType,
  recipeId: row.recipe_id,
  foodMasterId: row.food_master_id,
  setMenuId: row.set_menu_id,
  isTransferred: row.is_transferred,
  createdAt: row.created_at,
  ...resolvePlanNutrition(
    row,
    row.food_master_id ? foodMasterMap.get(row.food_master_id) : undefined,
    row.recipe_id ? recipeMap.get(row.recipe_id) : undefined,
  ),
});
