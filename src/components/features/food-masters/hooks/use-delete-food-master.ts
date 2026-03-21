"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";

/** Soft-delete a food master by setting deleted_at */
export const useDeleteFoodMaster = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("food_masters")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.foodMasters.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.foodMasters.detail(id),
      });
    },
  });
};
