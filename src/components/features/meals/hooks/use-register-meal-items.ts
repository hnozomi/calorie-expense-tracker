"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { MealType } from "@/types";
import type { MealItemDraft } from "../types/meal";

type RegisterParams = {
  date: string;
  mealType: MealType;
  items: MealItemDraft[];
};

/** Register multiple meal items in a single transaction via RPC */
export const useRegisterMealItems = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, mealType, items }: RegisterParams) => {
      // Get authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");

      // Ensure meal record exists (upsert)
      const { data: meal, error: mealError } = await supabase
        .from("meals")
        .upsert(
          { date, meal_type: mealType, user_id: user.id },
          { onConflict: "user_id,date,meal_type" },
        )
        .select("id")
        .single();

      if (mealError) throw mealError;

      // Batch insert items via RPC
      const { data, error } = await supabase.rpc("register_meal_items", {
        p_meal_id: meal.id,
        p_items: items.map((item) => ({
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          fat: item.fat,
          carbs: item.carbs,
          cost: item.cost ?? null,
          source_type: item.sourceType,
          food_master_id: item.foodMasterId ?? null,
          recipe_id: item.recipeId ?? null,
          set_menu_id: item.setMenuId ?? null,
        })),
      });

      if (error) throw error;
      return data;
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
