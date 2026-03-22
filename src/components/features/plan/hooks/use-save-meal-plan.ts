"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { MealType } from "@/types";
import type { MealPlanFormValues } from "../types/meal-plan";

type SaveMealPlanInput = {
  id?: string;
  date: string;
  mealType: MealType;
  values: MealPlanFormValues;
  recipeId?: string | null;
  foodMasterId?: string | null;
  setMenuId?: string | null;
};

/** Create or update a meal plan entry */
export const useSaveMealPlan = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveMealPlanInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const row = {
        date: input.date,
        meal_type: input.mealType,
        planned_name: input.values.plannedName,
        calories: input.values.calories,
        protein: input.values.protein,
        fat: input.values.fat,
        carbs: input.values.carbs,
        estimated_cost: input.values.estimatedCost,
        recipe_id: input.recipeId ?? null,
        food_master_id: input.foodMasterId ?? null,
        set_menu_id: input.setMenuId ?? null,
      };

      if (input.id) {
        const { error } = await supabase
          .from("meal_plans")
          .update(row)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("meal_plans")
          .insert({ ...row, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
    },
  });
};
