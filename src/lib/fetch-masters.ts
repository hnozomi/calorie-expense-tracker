import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AppDatabase,
  FoodMasterNutritionRow,
  RecipeNutritionRow,
} from "@/types";

type Masters = {
  foodMasterMap: Map<string, FoodMasterNutritionRow>;
  recipeMap: Map<string, RecipeNutritionRow>;
};

const toMasterMap = <Row extends { id: string }>(
  rows: Row[] | null | undefined,
) => new Map<string, Row>(rows?.map((row) => [row.id, row]));

// A failed read throws: an empty map would quietly show the values saved on the item instead of the master's
/** Read the food masters and recipes that items or plans point at */
export const fetchMasters = async (
  supabase: SupabaseClient<AppDatabase>,
  foodMasterIds: Set<string>,
  recipeIds: Set<string>,
): Promise<Masters> => {
  const [foodMasters, recipes] = await Promise.all([
    foodMasterIds.size > 0
      ? supabase
          .from("food_masters")
          .select(
            "id, name, calories, protein, fat, carbs, default_price, deleted_at",
          )
          .in("id", [...foodMasterIds])
      : null,
    recipeIds.size > 0
      ? supabase
          .from("recipes")
          .select(
            "id, name, calories, protein, fat, carbs, servings, deleted_at",
          )
          .in("id", [...recipeIds])
      : null,
  ]);
  if (foodMasters?.error) throw foodMasters.error;
  if (recipes?.error) throw recipes.error;

  return {
    foodMasterMap: toMasterMap(foodMasters?.data),
    recipeMap: toMasterMap(recipes?.data),
  };
};
