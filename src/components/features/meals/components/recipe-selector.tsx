"use client";
// Client because the search box filters the list as you type

import { Search } from "lucide-react";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PfcDisplay } from "@/components/ui/pfc-display";
import { useRecipeSelector } from "../hooks/use-recipe-selector";
import type { MealItemFormValues } from "../types/meal";

type Props = {
  recipes: Recipe[];
  onSelect: (values: MealItemFormValues, recipeId: string) => void;
};

/** Select a recipe to add to the meal registration card (per-person values) */
export const RecipeSelector = ({ recipes, onSelect }: Props) => {
  const { search, setSearch, filteredRecipes, handleSelect } =
    useRecipeSelector(recipes, onSelect);

  return (
    <div className="space-y-3">
      <div className="sticky -top-0.5 z-10 bg-background py-2">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="レシピ名で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-1">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              className="flex w-full flex-col gap-1 rounded-lg border border-transparent px-3 py-2.5 text-left text-sm transition-colors hover:border-border hover:bg-muted active:bg-muted/80"
              onClick={() => handleSelect(recipe)}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <p className="truncate font-medium">{recipe.name}</p>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {recipe.servings}人分
                  </Badge>
                </div>
                <span className="ml-2 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                  {Math.round(recipe.calories / recipe.servings)} kcal/人
                </span>
              </div>
              <PfcDisplay
                protein={recipe.protein / recipe.servings}
                fat={recipe.fat / recipe.servings}
                carbs={recipe.carbs / recipe.servings}
              />
            </button>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-muted-foreground/25 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              {search ? "該当するレシピがありません" : "レシピが未登録です"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
