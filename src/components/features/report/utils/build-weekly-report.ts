import type {
  DailyReportEntry,
  WeeklyReport,
} from "@/components/features/report/types/weekly-report";

/** A row of the get_weekly_summary RPC */
export type WeeklySummaryRow = {
  date: string;
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  total_cost: number;
};

// Averages are over the days that have records, so a half-recorded week is not pulled down by empty days
export const buildWeeklyReport = (
  weekStart: string,
  rows: WeeklySummaryRow[],
): WeeklyReport => {
  const entries: DailyReportEntry[] = rows.map((row) => ({
    date: row.date,
    calories: Number(row.total_calories),
    protein: Number(row.total_protein),
    fat: Number(row.total_fat),
    carbs: Number(row.total_carbs),
    totalCost: Number(row.total_cost),
  }));

  const divisor = Math.max(
    entries.filter((entry) => entry.calories > 0).length,
    1,
  );
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
};

/** Whether the week has anything recorded (calories, cost or any PFC) */
export const hasReportData = (report: WeeklyReport): boolean =>
  report.entries.some(
    (entry) =>
      entry.calories > 0 ||
      entry.totalCost > 0 ||
      entry.protein + entry.fat + entry.carbs > 0,
  );
