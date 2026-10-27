import type { Recipe } from "../types/recipe";

// The Supabase client has no generated types, so rows arrive untyped; the casts follow the table definitions in supabase/migrations

/** A recipes row (with recipe_ingredients) as Supabase returns it */
export const toRecipe = (row: Record<string, unknown>): Recipe => ({
  id: row.id as string,
  userId: row.user_id as string,
  name: row.name as string,
  servings: row.servings as number,
  calories: Number(row.calories),
  protein: Number(row.protein),
  fat: Number(row.fat),
  carbs: Number(row.carbs),
  notes: row.notes as string | null,
  deletedAt: row.deleted_at as string | null,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
  ingredients: (
    (row.recipe_ingredients as Record<string, unknown>[]) ?? []
  ).map((ing) => ({
    id: ing.id as string,
    recipeId: ing.recipe_id as string,
    ingredientName: ing.ingredient_name as string,
    quantity: Number(ing.quantity),
    unit: ing.unit as string,
    unitPrice: Number(ing.unit_price),
  })),
});
