"use client";

import { useRouter } from "next/navigation";
import type { DailyReportEntry } from "../types/weekly-report";

type WeeklyCalorieChartProps = {
  entries: DailyReportEntry[];
  averageCalories: number;
};

/** Day of week labels */
const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

/** Bar chart displaying daily calorie intake for the week */
const WeeklyCalorieChart = ({
  entries,
  averageCalories,
}: WeeklyCalorieChartProps) => {
  const router = useRouter();

  /** Find max value for scaling bars */
  const maxCalories = Math.max(...entries.map((e) => e.calories), 1);

  /** Navigate to daily view when a bar is tapped */
  const handleBarClick = (date: string) => {
    router.push(`/home?date=${date}`);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">カロリー</p>
        <p className="text-xs text-muted-foreground">
          平均 {Math.round(averageCalories)} kcal/日
        </p>
      </div>
      <div className="flex items-end gap-1" style={{ height: 120 }}>
        {entries.map((entry, i) => {
          const heightPct = (entry.calories / maxCalories) * 100;
          return (
            <button
              key={entry.date}
              type="button"
              className="group flex flex-1 flex-col items-center gap-1"
              onClick={() => handleBarClick(entry.date)}
            >
              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
                {Math.round(entry.calories)}
              </span>
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className="w-full max-w-[28px] rounded-t bg-primary/70 transition-colors hover:bg-primary"
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {DAY_LABELS[i]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { WeeklyCalorieChart };
