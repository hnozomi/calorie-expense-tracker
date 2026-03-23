"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import { getNutritionTargetQueryOptions } from "@/components/features/settings/queries";

/** Fetch the current user's nutrition targets */
export const useNutritionTarget = () => {
  const supabase = useSupabase();

  return useSuspenseQuery(getNutritionTargetQueryOptions(supabase));
};

type SaveTargetInput = {
  targetCalories: number;
  targetProtein: number;
  targetFat: number;
  targetCarbs: number;
};

/** Upsert the current user's nutrition targets */
export const useSaveNutritionTarget = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveTargetInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          target_calories: input.targetCalories,
          target_protein: input.targetProtein,
          target_fat: input.targetFat,
          target_carbs: input.targetCarbs,
        },
        { onConflict: "user_id" },
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.nutritionTarget(),
      });
    },
  });
};
