"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/utils";
import type { DailyReportEntry } from "../types/weekly-report";

type WeeklyCalorieChartProps = {
  entries: DailyReportEntry[];
  averageCalories: number;
};

/** Day of week labels */
const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

/** Weekend day indices (Saturday=5, Sunday=6) */
const WEEKEND_INDICES = new Set([5, 6]);

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
    <div className="space-y-3">
      {/* Average line indicator */}
      <div className="relative flex h-[140px] items-end gap-1.5">
        {/* Average dashed line */}
        {averageCalories > 0 && (
          <div
            className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-primary/30"
            style={{
              bottom: `${(averageCalories / maxCalories) * 100}%`,
            }}
          >
            <span className="absolute -top-4 right-0 text-[10px] font-medium text-primary/50">
              平均
            </span>
          </div>
        )}

        {entries.map((entry, i) => {
          const heightPct = (entry.calories / maxCalories) * 100;
          const isWeekend = WEEKEND_INDICES.has(i);
          return (
            <button
              key={entry.date}
              type="button"
              className="group flex flex-1 flex-col items-center gap-1"
              onClick={() => handleBarClick(entry.date)}
            >
              {/* Hover value tooltip */}
              <span className="min-h-[16px] text-[11px] font-semibold text-primary/80 opacity-0 transition-opacity group-hover:opacity-100">
                {entry.calories > 0 ? Math.round(entry.calories) : ""}
              </span>
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className={cn(
                    "w-full max-w-[32px] rounded-t-md transition-all duration-200",
                    "bg-gradient-to-t from-primary/80 to-primary/50",
                    "group-hover:from-primary group-hover:to-primary/70 group-hover:shadow-md",
                  )}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                />
              </div>
              {/* Day label */}
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isWeekend
                    ? "text-muted-foreground/70"
                    : "text-muted-foreground",
                )}
              >
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
