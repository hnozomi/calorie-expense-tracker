"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { MealType } from "@/types";

type TransferMealToPlanInput = {
  targetDate: string;
  mealType: MealType;
};

/** Transfer registered meal items to plan entries via RPC */
export const useTransferMealToPlan = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TransferMealToPlanInput) => {
      const { error } = await supabase.rpc("transfer_meal_to_plan", {
        p_target_date: input.targetDate,
        p_meal_type: input.mealType,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.daily(variables.targetDate),
      });
    },
  });
};
