"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { MealType } from "@/types";
import type { DailySummaryRow } from "../types/meal";

/** Fetch daily summary (calories/PFC/cost per meal_type) via RPC */
export const useDailySummary = (date: string) => {
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.meals.summary(date),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_daily_summary", {
        p_target_date: date,
      });

      if (error) throw error;

      return (data ?? []).map(
        (row: Record<string, unknown>): DailySummaryRow => ({
          mealType: row.meal_type as MealType,
          calories: row.total_calories as number,
          protein: row.total_protein as number,
          fat: row.total_fat as number,
          carbs: row.total_carbs as number,
          totalCost: row.total_cost as number,
          itemCount: row.item_count as number,
        }),
      );
    },
  });
};
