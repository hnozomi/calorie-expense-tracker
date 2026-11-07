import type { Recipe } from "@/components/features/recipes/types/recipe";
import type { Tables } from "@/lib/supabase/database.types";

type RecipeWithIngredientsRow = Tables<"recipes"> & {
  recipe_ingredients: Tables<"recipe_ingredients">[];
};

/** A recipes row (with recipe_ingredients) as Supabase returns it */
export const toRecipe = (row: RecipeWithIngredientsRow): Recipe => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  servings: row.servings,
  calories: Number(row.calories),
  protein: Number(row.protein),
  fat: Number(row.fat),
  carbs: Number(row.carbs),
  notes: row.notes,
  deletedAt: row.deleted_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  ingredients: row.recipe_ingredients.map((ing) => ({
    id: ing.id,
    recipeId: ing.recipe_id,
    ingredientName: ing.ingredient_name,
    quantity: Number(ing.quantity),
    unit: ing.unit,
    unitPrice: Number(ing.unit_price),
  })),
});
