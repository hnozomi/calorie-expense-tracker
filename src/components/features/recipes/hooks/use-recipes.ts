"use client";
// Client because the set menu form still reads recipes through TanStack Query (removed in phase 5)

import { useQuery } from "@tanstack/react-query";
import { toRecipe } from "@/components/features/recipes/utils/to-recipe";
import { queryKeys, useSupabase } from "@/hooks";

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
        .order("name", { ascending: true });

      if (search && search.trim().length > 0) {
        query = query.ilike("name", `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map(toRecipe);
    },
  });
};
