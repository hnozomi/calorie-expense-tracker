"use client";

import { useMemo } from "react";
import { useRecipes } from "@/components/features/recipes/hooks/use-recipes";
import { buildShoppingList } from "../utils/shopping-list";
import { useMealPlans } from "./use-meal-plans";

/** Build the shopping list for the displayed week from recipe-based plans */
export const useShoppingList = (weekStart: string) => {
  const { data: plans } = useMealPlans(weekStart);
  const { data: recipes, isLoading } = useRecipes();

  const entries = useMemo(
    () => buildShoppingList(plans, recipes ?? []),
    [plans, recipes],
  );

  const totalCost = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.estimatedCost, 0),
    [entries],
  );

  const hasRecipePlans = plans.some((plan) => plan.recipeId !== null);

  return { entries, totalCost, hasRecipePlans, isLoading };
};
