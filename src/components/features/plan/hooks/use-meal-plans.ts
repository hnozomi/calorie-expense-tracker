"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { MealType } from "@/types";
import { shiftDate } from "@/utils";
import type { MealPlan } from "../types/meal-plan";

/** Fetch meal plans for a given week (7 days starting from weekStart) */
export const useMealPlans = (weekStart: string) => {
  const supabase = useSupabase();

  /** Calculate end date (6 days after start) */
  const weekEnd = shiftDate(weekStart, 6);

  return useQuery({
    queryKey: queryKeys.plans.weekly(weekStart),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .gte("date", weekStart)
        .lte("date", weekEnd)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data ?? []).map(
        (row): MealPlan => ({
          id: row.id,
          userId: row.user_id,
          date: row.date,
          mealType: row.meal_type as MealType,
          plannedName: row.planned_name,
          recipeId: row.recipe_id,
          foodMasterId: row.food_master_id,
          setMenuId: row.set_menu_id,
          calories: Number(row.calories),
          protein: Number(row.protein),
          fat: Number(row.fat),
          carbs: Number(row.carbs),
          estimatedCost: Number(row.estimated_cost),
          isTransferred: row.is_transferred,
          createdAt: row.created_at,
        }),
      );
    },
  });
};
