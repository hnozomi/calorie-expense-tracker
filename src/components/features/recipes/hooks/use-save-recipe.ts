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

      const recipePayload = {
        user_id: user.id,
        name: values.name,
        servings: values.servings,
        calories: values.calories,
        protein: values.protein,
        fat: values.fat,
        carbs: values.carbs,
        notes: values.notes || null,
      };

      let recipeId: string;

      if (id) {
        const { error } = await supabase
          .from("recipes")
          .update(recipePayload)
          .eq("id", id);
        if (error) throw error;
        recipeId = id;

        // Delete existing ingredients and re-insert
        const { error: deleteError } = await supabase
          .from("recipe_ingredients")
          .delete()
          .eq("recipe_id", id);
        if (deleteError) throw deleteError;
      } else {
        const { data, error } = await supabase
          .from("recipes")
          .insert(recipePayload)
          .select("id")
          .single();
        if (error) throw error;
        recipeId = data.id;
      }

      // Insert ingredients
      if (ingredients.length > 0) {
        const ingredientRows = ingredients.map((ing) => ({
          recipe_id: recipeId,
          ingredient_name: ing.ingredientName,
          quantity: ing.quantity,
          unit: ing.unit,
          unit_price: ing.unitPrice,
        }));

        const { error: ingError } = await supabase
          .from("recipe_ingredients")
          .insert(ingredientRows);
        if (ingError) throw ingError;
      }

      return recipeId;
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
