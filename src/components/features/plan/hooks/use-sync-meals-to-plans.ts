"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";

type SyncMealsToPlansInput = {
  startDate: string;
  endDate: string;
};

/** Replace planned menus with actual meal records for past dates via RPC */
export const useSyncMealsToPlans = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SyncMealsToPlansInput) => {
      const { data, error } = await supabase.rpc("sync_meals_to_plans", {
        p_start_date: input.startDate,
        p_end_date: input.endDate,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
    },
  });
};
