"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { Recipe } from "../types/recipe";

/** Fetch recipes list with optional search, excluding soft-deleted */
export const useRecipes = (search?: string) => {
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.recipes.list(search),
    queryFn: async () => {
      let query = supabase
        .from("recipes")
        .select("*, recipe_ingredients(*)")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });

      if (search && search.trim().length > 0) {
        query = query.ilike("name", `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map(
        (row): Recipe => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          servings: row.servings,
          calories: Number(row.calories),
          protein: Number(row.protein),
          fat: Number(row.fat),
          carbs: Number(row.carbs),
          notes: row.notes,
          deletedAt: row.deleted_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          ingredients: (row.recipe_ingredients ?? []).map(
            (ing: Record<string, unknown>) => ({
              id: ing.id as string,
              recipeId: ing.recipe_id as string,
              ingredientName: ing.ingredient_name as string,
              quantity: Number(ing.quantity),
              unit: ing.unit as string,
              unitPrice: Number(ing.unit_price),
            }),
          ),
        }),
      );
    },
  });
};
