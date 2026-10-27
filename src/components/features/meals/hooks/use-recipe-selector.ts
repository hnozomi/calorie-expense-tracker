"use client";

import { useState } from "react";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import { totalIngredientCost } from "@/components/features/recipes/utils/recipe-cost";
import { matchesSearch } from "@/utils/matches-search";
import type { MealItemFormValues } from "../types/meal";

/** Search narrows the recipes as you type and a tap adds one person's share */
export const useRecipeSelector = (
  recipes: Recipe[],
  onSelect: (values: MealItemFormValues, recipeId: string) => void,
) => {
  const [search, setSearch] = useState("");
  const filteredRecipes = recipes.filter((recipe) =>
    matchesSearch([recipe.name], search),
  );

  const handleSelect = (recipe: Recipe) => {
    const perPerson = recipe.servings || 1;
    const recipeCost = totalIngredientCost(recipe);

    onSelect(
      {
        name: recipe.name,
        calories: recipe.calories / perPerson,
        protein: recipe.protein / perPerson,
        fat: recipe.fat / perPerson,
        carbs: recipe.carbs / perPerson,
        cost: recipeCost / perPerson,
      },
      recipe.id,
    );
  };

  return { search, setSearch, filteredRecipes, handleSelect };
};
