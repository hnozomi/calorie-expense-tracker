import type { SupabaseClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import type { MealType } from "@/types";
import type { DailySummaryRow, MealItem } from "./types/meal";

type DailyMealGroup = Record<
  MealType,
  { mealId: string | null; items: MealItem[] }
>;

const createEmptyDailyMeals = (): DailyMealGroup => ({
  breakfast: { mealId: null, items: [] },
  lunch: { mealId: null, items: [] },
  dinner: { mealId: null, items: [] },
  snack: { mealId: null, items: [] },
});

type MasterRow = Record<string, unknown>;

/** Collect unique non-null IDs from meal items by source type */
const collectMasterIds = (items: Record<string, unknown>[]) => {
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
const mapMealItem = (
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

      // Collect all meal items across meals to batch-fetch masters
      const allItems = (data ?? []).flatMap(
        (meal) => (meal.meal_items as Record<string, unknown>[]) ?? [],
      );
      const { foodMasterIds, recipeIds } = collectMasterIds(allItems);
      const { foodMasterMap, recipeMap } = await fetchMasters(
        supabase,
        foodMasterIds,
        recipeIds,
      );

      const grouped = createEmptyDailyMeals();

      for (const meal of data ?? []) {
        const mealType = meal.meal_type as MealType;
        grouped[mealType] = {
          mealId: meal.id,
          items: ((meal.meal_items as Record<string, unknown>[]) ?? []).map(
            (item) => mapMealItem(item, foodMasterMap, recipeMap),
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
