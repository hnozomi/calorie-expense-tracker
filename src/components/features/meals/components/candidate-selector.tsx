"use client";
// Client because it unwraps the candidates the server started reading (use) and passes tap handlers down

import { use } from "react";
import type {
  CandidateTab,
  DrawerCandidates,
} from "../types/drawer-candidates";
import type { MealItemFormValues } from "../types/meal";
import type { RecentMealItem } from "../utils/recent-meal-items";
import { FoodMasterSelector } from "./food-master-selector";
import { RecentItemsSelector } from "./recent-items-selector";
import { RecipeSelector } from "./recipe-selector";
import { SetMenuSelector } from "./set-menu-selector";

type Props = {
  tab: CandidateTab;
  candidates: Promise<DrawerCandidates>;
  onRecentSelect: (item: RecentMealItem) => void;
  onRecipeSelect: (values: MealItemFormValues, recipeId: string) => void;
  onFoodMasterSelect: (
    values: MealItemFormValues,
    foodMasterId: string,
  ) => void;
  onSetMenuSelect: React.ComponentProps<typeof SetMenuSelector>["onSelect"];
};

/** The list for the drawer's current tab, from the candidates read with the home screen */
export const CandidateSelector = ({
  tab,
  candidates,
  onRecentSelect,
  onRecipeSelect,
  onFoodMasterSelect,
  onSetMenuSelect,
}: Props) => {
  const { recentItems, recipes, foodMasters, setMenus, hasError } =
    use(candidates);
  if (hasError) {
    return (
      <p className="rounded-lg border border-dashed border-destructive/40 py-6 text-center text-sm text-destructive">
        一覧を読み込めませんでした。画面を開き直すか、手動タブで入力してください
      </p>
    );
  }
  switch (tab) {
    case "recent":
      return (
        <RecentItemsSelector
          recentItems={recentItems}
          onSelect={onRecentSelect}
        />
      );
    case "recipe":
      return <RecipeSelector recipes={recipes} onSelect={onRecipeSelect} />;
    case "food_master":
      return (
        <FoodMasterSelector
          foodMasters={foodMasters}
          onSelect={onFoodMasterSelect}
        />
      );
    case "set_menu":
      return <SetMenuSelector setMenus={setMenus} onSelect={onSetMenuSelect} />;
  }
};
