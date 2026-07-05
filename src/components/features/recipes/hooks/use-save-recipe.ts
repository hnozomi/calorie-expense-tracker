"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { IngredientFormValues, RecipeFormValues } from "../types/recipe";

type SaveParams = {
  id?: string;
  values: RecipeFormValues;
  ingredients: IngredientFormValues[];
};

/** Create or update a recipe with its ingredients */
export const useSaveRecipe = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values, ingredients }: SaveParams) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");

      // Save recipe and ingredients atomically so a mid-save failure
      // cannot leave the recipe without its ingredients
      const { data, error } = await supabase.rpc(
        "save_recipe_with_ingredients",
        {
          p_id: id ?? null,
          p_name: values.name,
          p_servings: values.servings,
          p_calories: values.calories,
          p_protein: values.protein,
          p_fat: values.fat,
          p_carbs: values.carbs,
          p_notes: values.notes || null,
          p_ingredients: ingredients.map((ing) => ({
            ingredient_name: ing.ingredientName,
            quantity: ing.quantity,
            unit: ing.unit,
            unit_price: ing.unitPrice,
          })),
        },
      );
      if (error) throw error;

      return data as string;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.all,
      });
      if (id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.recipes.detail(id),
        });
      }
    },
  });
};
