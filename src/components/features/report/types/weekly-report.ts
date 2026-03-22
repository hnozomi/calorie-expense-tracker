import type { NutritionValues } from "@/types";

/** A single day's aggregated data for the weekly report */
export type DailyReportEntry = NutritionValues & {
  date: string;
  totalCost: number;
};

/** Weekly report data containing 7 days of entries */
export type WeeklyReport = {
  weekStart: string;
  entries: DailyReportEntry[];
  averageCalories: number;
  averageProtein: number;
  averageFat: number;
  averageCarbs: number;
  averageCost: number;
  totalCost: number;
};
