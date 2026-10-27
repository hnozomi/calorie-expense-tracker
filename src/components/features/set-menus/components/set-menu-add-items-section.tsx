import { ListPlus } from "lucide-react";
import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import {
  foodMasterCaloriesLabel,
  recipeCaloriesLabel,
} from "@/components/features/set-menus/utils/display-values";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SetMenuCandidateList } from "./set-menu-candidate-list";

type Props = {
  recipes: Recipe[];
  foodMasters: FoodMaster[];
  recipeSearch: string;
  fmSearch: string;
  onRecipeSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFmSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddRecipe: (recipe: Recipe) => void;
  onAddFoodMaster: (foodMaster: FoodMaster) => void;
};

export const SetMenuAddItemsSection = ({
  recipes,
  foodMasters,
  recipeSearch,
  fmSearch,
  onRecipeSearchChange,
  onFmSearchChange,
  onAddRecipe,
  onAddFoodMaster,
}: Props) => (
  <section className="space-y-3">
    <SectionHeader icon={ListPlus} label="アイテムを追加" />
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
      <Tabs defaultValue="recipe">
        <TabsList className="w-full">
          <TabsTrigger value="recipe" className="flex-1">
            レシピから
          </TabsTrigger>
          <TabsTrigger value="food_master" className="flex-1">
            マスタから
          </TabsTrigger>
        </TabsList>
        <TabsContent value="recipe" className="mt-3">
          <SetMenuCandidateList
            candidates={recipes}
            search={recipeSearch}
            placeholder="レシピ名で検索..."
            emptyMessage="レシピが未登録です"
            searchEmptyMessage="該当するレシピがありません"
            caloriesLabelOf={recipeCaloriesLabel}
            onSearchChange={onRecipeSearchChange}
            onAdd={onAddRecipe}
          />
        </TabsContent>
        <TabsContent value="food_master" className="mt-3">
          <SetMenuCandidateList
            candidates={foodMasters}
            search={fmSearch}
            placeholder="食品名・ブランドで検索..."
            emptyMessage="食品マスタが未登録です"
            searchEmptyMessage="該当する食品がありません"
            caloriesLabelOf={foodMasterCaloriesLabel}
            onSearchChange={onFmSearchChange}
            onAdd={onAddFoodMaster}
          />
        </TabsContent>
      </Tabs>
    </div>
  </section>
);
