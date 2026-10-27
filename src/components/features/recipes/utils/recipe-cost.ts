import type { Recipe } from "@/components/features/recipes/types/recipe";

/** The whole recipe's ingredient cost (unit price × quantity, summed) */
export const totalIngredientCost = (
  recipe: Pick<Recipe, "ingredients">,
): number =>
  recipe.ingredients.reduce(
    (sum, ingredient) => sum + ingredient.unitPrice * ingredient.quantity,
    0,
  );
