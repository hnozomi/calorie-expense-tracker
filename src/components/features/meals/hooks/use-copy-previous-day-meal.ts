"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { MealType } from "@/types";
import { shiftDate } from "@/utils";

type CopyPreviousDayInput = {
  date: string;
  mealType: MealType;
};

/** Copy the previous day's items in the same slot into the given date.
 *  Returns the number of copied items (0 when the previous day is empty). */
export const useCopyPreviousDayMeal = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, mealType }: CopyPreviousDayInput) => {
      const previousDate = shiftDate(date, -1);

      const { data: previousMeal, error: fetchError } = await supabase
        .from("meals")
        .select("id, meal_items(*)")
        .eq("date", previousDate)
        .eq("meal_type", mealType)
        .maybeSingle();
      if (fetchError) throw fetchError;

      const previousItems = [...(previousMeal?.meal_items ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      );
      if (previousItems.length === 0) return 0;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");

      // Ensure the target meal exists, then batch-insert via the existing RPC
      const { data: meal, error: mealError } = await supabase
        .from("meals")
        .upsert(
          { date, meal_type: mealType, user_id: user.id },
          { onConflict: "user_id,date,meal_type" },
        )
        .select("id")
        .single();
      if (mealError) throw mealError;

      const { error: registerError } = await supabase.rpc(
        "register_meal_items",
        {
          p_meal_id: meal.id,
          p_items: previousItems.map((item) => ({
            name: item.name,
            calories: item.calories,
            protein: item.protein,
            fat: item.fat,
            carbs: item.carbs,
            cost: item.cost,
            source_type: item.source_type,
            food_master_id: item.food_master_id,
            recipe_id: item.recipe_id,
            set_menu_id: item.set_menu_id,
          })),
        },
      );
      if (registerError) throw registerError;

      return previousItems.length;
    },
    onSuccess: (copiedCount, variables) => {
      if (copiedCount === 0) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.daily(variables.date),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.summary(variables.date),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.meals.recentItems(),
      });
    },
  });
};
