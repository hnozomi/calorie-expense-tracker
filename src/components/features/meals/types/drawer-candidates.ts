import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import type { SetMenu } from "@/components/features/set-menus/types/set-menu";
import type { RecentMealItem } from "../utils/recent-meal-items";

/** What the register drawer's list tabs choose from */
export type DrawerCandidates = {
  recentItems: RecentMealItem[];
  recipes: Recipe[];
  foodMasters: FoodMaster[];
  setMenus: SetMenu[];
  /** The lists could not be read; the drawer says so and manual input still works */
  hasError: boolean;
};

export type CandidateTab = "recent" | "recipe" | "food_master" | "set_menu";

/** The register drawer's tabs: typed input, the four candidate lists, and the nutrition label camera */
export type RegisterTab = "manual" | CandidateTab | "ocr";
