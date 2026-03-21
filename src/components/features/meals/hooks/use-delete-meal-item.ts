"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";

type DeleteParams = {
  itemId: string;
  date: string;
};

/** Delete a single meal item */
export const useDeleteMealItem = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId }: DeleteParams) => {
      const { error } = await supabase
        .from("meal_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.daily(variables.date),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.summary(variables.date),
      });
    },
  });
};
