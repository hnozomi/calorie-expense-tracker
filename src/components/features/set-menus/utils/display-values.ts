import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import type { SetMenuItemDraft } from "@/components/features/set-menus/types/set-menu";

/** A recipe's calories for one person, as the add list shows it */
export const recipeCaloriesLabel = (recipe: Recipe): string =>
  `${Math.round(recipe.calories / (recipe.servings || 1))} kcal/人`;

export const foodMasterCaloriesLabel = (foodMaster: FoodMaster): string =>
  `${Math.round(foodMaster.calories)} kcal`;

/** An item's calories and cost for its serving quantity, rounded for display */
export const scaledItemValues = (item: SetMenuItemDraft) => ({
  calories: Math.round(item.calories * item.servingQuantity),
  cost: Math.round(item.cost * item.servingQuantity),
});
