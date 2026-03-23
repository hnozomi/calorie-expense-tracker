"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { DailyReportEntry, WeeklyReport } from "../types/weekly-report";

/** Fetch weekly summary via RPC and compute averages */
export const useWeeklyReport = (weekStart: string) => {
  const supabase = useSupabase();

  return useSuspenseQuery({
    queryKey: queryKeys.report.weekly(weekStart),
    queryFn: async (): Promise<WeeklyReport> => {
      const { data, error } = await supabase.rpc("get_weekly_summary", {
        p_start_date: weekStart,
      });
      if (error) throw error;

      const entries: DailyReportEntry[] = (
        data as {
          date: string;
          total_calories: number;
          total_protein: number;
          total_fat: number;
          total_carbs: number;
          total_cost: number;
        }[]
      ).map((row) => ({
        date: row.date,
        calories: Number(row.total_calories),
        protein: Number(row.total_protein),
        fat: Number(row.total_fat),
        carbs: Number(row.total_carbs),
        totalCost: Number(row.total_cost),
      }));

      /** Count days that have any recorded data */
      const daysWithData = entries.filter((e) => e.calories > 0).length;
      const divisor = Math.max(daysWithData, 1);

      const totals = entries.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          protein: acc.protein + e.protein,
          fat: acc.fat + e.fat,
          carbs: acc.carbs + e.carbs,
          cost: acc.cost + e.totalCost,
        }),
        { calories: 0, protein: 0, fat: 0, carbs: 0, cost: 0 },
      );

      return {
        weekStart,
        entries,
        averageCalories: totals.calories / divisor,
        averageProtein: totals.protein / divisor,
        averageFat: totals.fat / divisor,
        averageCarbs: totals.carbs / divisor,
        averageCost: totals.cost / divisor,
        totalCost: totals.cost,
      };
    },
  });
};
