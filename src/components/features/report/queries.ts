import type { SupabaseClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import type { DailyReportEntry, WeeklyReport } from "./types/weekly-report";

type WeeklySummaryRow = {
  date: string;
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  total_cost: number;
};

export const getWeeklyReportQueryOptions = (
  supabase: SupabaseClient,
  weekStart: string,
) =>
  queryOptions({
    queryKey: queryKeys.report.weekly(weekStart),
    queryFn: async (): Promise<WeeklyReport> => {
      const { data, error } = await supabase.rpc("get_weekly_summary", {
        p_start_date: weekStart,
      });
      if (error) throw error;

      const entries: DailyReportEntry[] = ((data ?? []) as WeeklySummaryRow[]).map(
        (row) => ({
          date: row.date,
          calories: Number(row.total_calories),
          protein: Number(row.total_protein),
          fat: Number(row.total_fat),
          carbs: Number(row.total_carbs),
          totalCost: Number(row.total_cost),
        }),
      );

      const daysWithData = entries.filter((entry) => entry.calories > 0).length;
      const divisor = Math.max(daysWithData, 1);

      const totals = entries.reduce(
        (acc, entry) => ({
          calories: acc.calories + entry.calories,
          protein: acc.protein + entry.protein,
          fat: acc.fat + entry.fat,
          carbs: acc.carbs + entry.carbs,
          cost: acc.cost + entry.totalCost,
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
