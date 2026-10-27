import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import type { SetMenu } from "@/components/features/set-menus/types/set-menu";

/** What a plan cell chooses from, and the recipes the shopping list adds up */
export type PlanCandidates = {
  recipes: Recipe[];
  foodMasters: FoodMaster[];
  setMenus: SetMenu[];
  /** The lists could not be read; the dialogs say so and manual input still works */
  hasError: boolean;
};
