"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { Recipe, RecipeIngredient } from "../types/recipe";

/** Fetch a single recipe by ID with ingredients */
export const useRecipeDetail = (id: string | undefined) => {
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.recipes.detail(id ?? ""),
    enabled: !!id && id !== "new",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*, recipe_ingredients(*)")
        .eq("id", id!)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        servings: data.servings,
        calories: Number(data.calories),
        protein: Number(data.protein),
        fat: Number(data.fat),
        carbs: Number(data.carbs),
        notes: data.notes,
        deletedAt: data.deleted_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        ingredients: (data.recipe_ingredients ?? []).map(
          (ing: Record<string, unknown>): RecipeIngredient => ({
            id: ing.id as string,
            recipeId: ing.recipe_id as string,
            ingredientName: ing.ingredient_name as string,
            quantity: Number(ing.quantity),
            unit: ing.unit as string,
            unitPrice: Number(ing.unit_price),
          }),
        ),
      } satisfies Recipe;
    },
  });
};
