"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";

/** Soft-delete a recipe by setting deleted_at */
export const useDeleteRecipe = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("recipes")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.detail(id),
      });
    },
  });
};
