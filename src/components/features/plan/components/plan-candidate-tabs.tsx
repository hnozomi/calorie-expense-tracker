import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import type { SetMenu } from "@/components/features/set-menus/types/set-menu";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { PlanCandidateList } from "./plan-candidate-list";

type Props = {
  hasError: boolean;
  recipes: Recipe[];
  recipeSearch: string;
  onRecipeSearchChange: (search: string) => void;
  foodMasters: FoodMaster[];
  fmSearch: string;
  onFmSearchChange: (search: string) => void;
  setMenus: SetMenu[];
  onSelectRecipe: (recipe: Recipe) => void;
  onSelectFoodMaster: (foodMaster: FoodMaster) => void;
  onSelectSetMenu: (setMenu: SetMenu) => void;
};

export const PlanCandidateTabs = ({
  hasError,
  recipes,
  recipeSearch,
  onRecipeSearchChange,
  foodMasters,
  fmSearch,
  onFmSearchChange,
  setMenus,
  onSelectRecipe,
  onSelectFoodMaster,
  onSelectSetMenu,
}: Props) =>
  hasError ? (
    ["recipe", "food_master", "set_menu"].map((tab) => (
      <TabsContent key={tab} value={tab} className="mt-4">
        <p className="py-6 text-center text-sm text-destructive">
          一覧を読み込めませんでした。画面を開き直すか、手動タブで入力してください
        </p>
      </TabsContent>
    ))
  ) : (
    <>
      <TabsContent value="recipe" className="mt-4 space-y-3">
        <Input
          placeholder="レシピ名で検索..."
          value={recipeSearch}
          onChange={(e) => onRecipeSearchChange(e.target.value)}
          className="h-9"
        />
        <PlanCandidateList
          candidates={recipes}
          caloriesOf={(recipe) => recipe.calories / recipe.servings}
          emptyMessage={
            recipeSearch ? "該当するレシピがありません" : "レシピが未登録です"
          }
          onSelect={onSelectRecipe}
        />
      </TabsContent>
      <TabsContent value="food_master" className="mt-4 space-y-3">
        <Input
          placeholder="食品名・ブランドで検索..."
          value={fmSearch}
          onChange={(e) => onFmSearchChange(e.target.value)}
          className="h-9"
        />
        <PlanCandidateList
          candidates={foodMasters}
          caloriesOf={(fm) => fm.calories}
          emptyMessage={
            fmSearch ? "該当する食品がありません" : "食品マスタが未登録です"
          }
          onSelect={onSelectFoodMaster}
        />
      </TabsContent>
      <TabsContent value="set_menu" className="mt-4">
        <PlanCandidateList
          candidates={setMenus}
          caloriesOf={(sm) => sm.totalCalories}
          emptyMessage="セットメニューが未登録です"
          onSelect={onSelectSetMenu}
        />
      </TabsContent>
    </>
  );
