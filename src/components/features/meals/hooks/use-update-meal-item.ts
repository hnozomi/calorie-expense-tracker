"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { MealItemFormValues } from "../types/meal";

type UpdateParams = {
  itemId: string;
  date: string;
  values: MealItemFormValues;
};

/** Update a single meal item's nutrition/cost values */
export const useUpdateMealItem = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, values }: UpdateParams) => {
      const { error } = await supabase
        .from("meal_items")
        .update({
          name: values.name,
          calories: values.calories,
          protein: values.protein,
          fat: values.fat,
          carbs: values.carbs,
          cost: values.cost ?? null,
        })
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
