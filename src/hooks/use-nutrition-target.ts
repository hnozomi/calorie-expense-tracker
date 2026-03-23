"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { NutritionTarget } from "@/types/settings";
import { DEFAULT_NUTRITION_TARGET } from "@/types/settings";

/** Fetch the current user's nutrition targets */
export const useNutritionTarget = () => {
  const supabase = useSupabase();

  return useSuspenseQuery({
    queryKey: queryKeys.settings.nutritionTarget(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;

      if (!data) return DEFAULT_NUTRITION_TARGET;

      return {
        id: data.id,
        userId: data.user_id,
        targetCalories: Number(data.target_calories),
        targetProtein: Number(data.target_protein),
        targetFat: Number(data.target_fat),
        targetCarbs: Number(data.target_carbs),
      } as NutritionTarget;
    },
  });
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
