"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { MealType } from "@/types";

type TransferPlanInput = {
  targetDate: string;
  mealType: MealType;
};

/** Transfer untransferred meal plans to actual meal items via RPC */
export const useTransferPlan = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TransferPlanInput) => {
      const { error } = await supabase.rpc("transfer_plan_to_meal", {
        p_target_date: input.targetDate,
        p_meal_type: input.mealType,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.daily(variables.targetDate),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.summary(variables.targetDate),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
    },
  });
};
