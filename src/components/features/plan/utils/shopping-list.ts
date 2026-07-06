import type { Recipe } from "@/components/features/recipes/types/recipe";
import type { MealPlan } from "../types/meal-plan";

/** One aggregated ingredient line on the shopping list */
export type ShoppingListEntry = {
  /** Stable key: ingredient name + unit */
  key: string;
  ingredientName: string;
  unit: string;
  totalQuantity: number;
  estimatedCost: number;
};

/** Aggregate recipe ingredients for the given plans into a shopping list.
 *  Each plan row counts as one serving, so ingredient amounts are divided
 *  by the recipe's servings. Plans without a recipe are ignored. */
export const buildShoppingList = (
  plans: MealPlan[],
  recipes: Recipe[],
): ShoppingListEntry[] => {
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));

  const servingsByRecipeId = new Map<string, number>();
  for (const plan of plans) {
    if (!plan.recipeId) continue;
    servingsByRecipeId.set(
      plan.recipeId,
      (servingsByRecipeId.get(plan.recipeId) ?? 0) + 1,
    );
  }

  const entries = new Map<string, ShoppingListEntry>();
  for (const [recipeId, planServings] of servingsByRecipeId) {
    const recipe = recipeById.get(recipeId);
    if (!recipe || recipe.servings <= 0) continue;

    const ratio = planServings / recipe.servings;
    for (const ingredient of recipe.ingredients) {
      const name = ingredient.ingredientName.trim();
      if (!name) continue;
      const key = `${name}|${ingredient.unit}`;
      const existing = entries.get(key);
      if (existing) {
        existing.totalQuantity += ingredient.quantity * ratio;
        existing.estimatedCost += ingredient.unitPrice * ratio;
      } else {
        entries.set(key, {
          key,
          ingredientName: name,
          unit: ingredient.unit,
          totalQuantity: ingredient.quantity * ratio,
          estimatedCost: ingredient.unitPrice * ratio,
        });
      }
    }
  }

  return [...entries.values()].sort((a, b) =>
    a.ingredientName.localeCompare(b.ingredientName, "ja"),
  );
};

/** Format a quantity for display: max 1 decimal, no trailing zero */
export const formatShoppingQuantity = (quantity: number): string => {
  const rounded = Math.round(quantity * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};
