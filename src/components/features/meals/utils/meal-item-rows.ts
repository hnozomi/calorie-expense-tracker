import type {
  DailyMealGroup,
  MealItem,
} from "@/components/features/meals/types/meal";
import type { Tables } from "@/lib/supabase/database.types";
import type {
  FoodMasterNutritionRow,
  MealType,
  RecipeNutritionRow,
  SourceType,
} from "@/types";

type MealItemRow = Tables<"meal_items">;

type MealWithItemsRow = Pick<Tables<"meals">, "id" | "meal_type"> & {
  meal_items: MealItemRow[] | null;
};

export const createEmptyDailyMeals = (): DailyMealGroup => ({
  breakfast: { mealId: null, items: [] },
  lunch: { mealId: null, items: [] },
  dinner: { mealId: null, items: [] },
  snack: { mealId: null, items: [] },
});

/** Collect unique non-null IDs from meal items by source type */
export const collectMasterIds = (
  items: Pick<MealItemRow, "source_type" | "food_master_id" | "recipe_id">[],
) => {
  const foodMasterIds = new Set<string>();
  const recipeIds = new Set<string>();

  for (const item of items) {
    if (item.source_type === "food_master" && item.food_master_id) {
      foodMasterIds.add(item.food_master_id);
    }
    if (item.source_type === "recipe" && item.recipe_id) {
      recipeIds.add(item.recipe_id);
    }
  }

  return { foodMasterIds, recipeIds };
};

/** Resolve nutrition values from master data, falling back to snapshot */
const resolveNutrition = (
  item: MealItemRow,
  foodMaster: FoodMasterNutritionRow | undefined,
  recipe: RecipeNutritionRow | undefined,
) => {
  // food_master source: use master values if it still exists (not soft-deleted)
  if (
    item.source_type === "food_master" &&
    foodMaster &&
    !foodMaster.deleted_at
  ) {
    return {
      name: foodMaster.name,
      calories: Number(foodMaster.calories),
      protein: Number(foodMaster.protein),
      fat: Number(foodMaster.fat),
      carbs: Number(foodMaster.carbs),
      cost: foodMaster.default_price,
    };
  }

  // recipe source: use per-serving values from master if it still exists
  if (item.source_type === "recipe" && recipe && !recipe.deleted_at) {
    const servings = Math.max(Number(recipe.servings) || 1, 1);
    return {
      name: recipe.name,
      calories: Number(recipe.calories) / servings,
      protein: Number(recipe.protein) / servings,
      fat: Number(recipe.fat) / servings,
      carbs: Number(recipe.carbs) / servings,
      cost: item.cost,
    };
  }

  // Fallback: use snapshot values stored in meal_items
  return {
    name: item.name,
    calories: Number(item.calories),
    protein: Number(item.protein),
    fat: Number(item.fat),
    carbs: Number(item.carbs),
    cost: item.cost,
  };
};

/** Map a raw meal_items row to MealItem, resolving master values */
const mapMealItem = (
  item: MealItemRow,
  foodMasterMap: Map<string, FoodMasterNutritionRow>,
  recipeMap: Map<string, RecipeNutritionRow>,
): MealItem => {
  const foodMaster = item.food_master_id
    ? foodMasterMap.get(item.food_master_id)
    : undefined;
  const recipe = item.recipe_id ? recipeMap.get(item.recipe_id) : undefined;
  const resolved = resolveNutrition(item, foodMaster, recipe);

  return {
    id: item.id,
    mealId: item.meal_id,
    ...resolved,
    // source_type is a check-constrained text column holding one of SOURCE_TYPES
    sourceType: item.source_type as SourceType,
    recipeId: item.recipe_id,
    foodMasterId: item.food_master_id,
    setMenuId: item.set_menu_id,
    servingQuantity: item.serving_quantity,
    sortOrder: item.sort_order,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
};

/** Group meals rows (with meal_items) by meal type, resolving each item against its master */
export const groupDailyMeals = (
  meals: MealWithItemsRow[],
  foodMasterMap: Map<string, FoodMasterNutritionRow>,
  recipeMap: Map<string, RecipeNutritionRow>,
): DailyMealGroup => {
  const grouped = createEmptyDailyMeals();
  for (const meal of meals) {
    // meal_type is a check-constrained text column holding one of MEAL_TYPES
    const mealType = meal.meal_type as MealType;
    grouped[mealType] = {
      mealId: meal.id,
      items: (meal.meal_items ?? []).map((item) =>
        mapMealItem(item, foodMasterMap, recipeMap),
      ),
    };
  }
  return grouped;
};
