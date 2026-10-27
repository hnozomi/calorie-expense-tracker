import type { MealType } from "@/types";
import type { DailyMealGroup, MealItem } from "../types/meal";

export type MasterRow = Record<string, unknown>;

export const createEmptyDailyMeals = (): DailyMealGroup => ({
  breakfast: { mealId: null, items: [] },
  lunch: { mealId: null, items: [] },
  dinner: { mealId: null, items: [] },
  snack: { mealId: null, items: [] },
});

/** Collect unique non-null IDs from meal items by source type */
export const collectMasterIds = (items: Record<string, unknown>[]) => {
  const foodMasterIds = new Set<string>();
  const recipeIds = new Set<string>();

  for (const item of items) {
    if (item.source_type === "food_master" && item.food_master_id) {
      foodMasterIds.add(item.food_master_id as string);
    }
    if (item.source_type === "recipe" && item.recipe_id) {
      recipeIds.add(item.recipe_id as string);
    }
  }

  return { foodMasterIds, recipeIds };
};

/** Resolve nutrition values from master data, falling back to snapshot */
const resolveNutrition = (
  item: Record<string, unknown>,
  foodMaster: MasterRow | undefined,
  recipe: MasterRow | undefined,
) => {
  // food_master source: use master values if it still exists (not soft-deleted)
  if (
    item.source_type === "food_master" &&
    foodMaster &&
    !foodMaster.deleted_at
  ) {
    return {
      name: foodMaster.name as string,
      calories: Number(foodMaster.calories),
      protein: Number(foodMaster.protein),
      fat: Number(foodMaster.fat),
      carbs: Number(foodMaster.carbs),
      cost: foodMaster.default_price as number | null,
    };
  }

  // recipe source: use per-serving values from master if it still exists
  if (item.source_type === "recipe" && recipe && !recipe.deleted_at) {
    const servings = Math.max(Number(recipe.servings) || 1, 1);
    return {
      name: recipe.name as string,
      calories: Number(recipe.calories) / servings,
      protein: Number(recipe.protein) / servings,
      fat: Number(recipe.fat) / servings,
      carbs: Number(recipe.carbs) / servings,
      cost: item.cost as number | null,
    };
  }

  // Fallback: use snapshot values stored in meal_items
  return {
    name: item.name as string,
    calories: Number(item.calories),
    protein: Number(item.protein),
    fat: Number(item.fat),
    carbs: Number(item.carbs),
    cost: item.cost as number | null,
  };
};

/** Map a raw meal_items row to MealItem, resolving master values */
export const mapMealItem = (
  item: Record<string, unknown>,
  foodMasterMap: Map<string, MasterRow>,
  recipeMap: Map<string, MasterRow>,
): MealItem => {
  const foodMaster = foodMasterMap.get(item.food_master_id as string);
  const recipe = recipeMap.get(item.recipe_id as string);
  const resolved = resolveNutrition(item, foodMaster, recipe);

  return {
    id: item.id as string,
    mealId: item.meal_id as string,
    ...resolved,
    sourceType: item.source_type as MealItem["sourceType"],
    recipeId: item.recipe_id as string | null,
    foodMasterId: item.food_master_id as string | null,
    setMenuId: item.set_menu_id as string | null,
    servingQuantity: item.serving_quantity as number,
    sortOrder: item.sort_order as number,
    createdAt: item.created_at as string,
    updatedAt: item.updated_at as string,
  };
};

/** Group meals rows (with meal_items) by meal type, resolving each item against its master */
export const groupDailyMeals = (
  meals: Record<string, unknown>[],
  foodMasterMap: Map<string, MasterRow>,
  recipeMap: Map<string, MasterRow>,
): DailyMealGroup => {
  const grouped = createEmptyDailyMeals();
  for (const meal of meals) {
    const mealType = meal.meal_type as MealType;
    grouped[mealType] = {
      mealId: meal.id as string,
      items: ((meal.meal_items as Record<string, unknown>[]) ?? []).map(
        (item) => mapMealItem(item, foodMasterMap, recipeMap),
      ),
    };
  }
  return grouped;
};
