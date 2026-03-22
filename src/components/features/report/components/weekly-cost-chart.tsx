"use client";

import { cn } from "@/utils";
import type { DailyReportEntry } from "../types/weekly-report";

type WeeklyCostChartProps = {
  entries: DailyReportEntry[];
  averageCost: number;
  totalCost: number;
};

/** Day of week labels */
const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

/** Bar chart displaying daily food cost for the week */
const WeeklyCostChart = ({
  entries,
  averageCost,
  totalCost,
}: WeeklyCostChartProps) => {
  /** Find max value for scaling bars */
  const maxCost = Math.max(...entries.map((e) => e.totalCost), 1);

  return (
    <div className="space-y-3">
      {/* Summary stats */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          合計{" "}
          <span className="font-semibold tabular-nums text-foreground">
            ¥{Math.round(totalCost).toLocaleString()}
          </span>
        </span>
        <span className="text-xs text-muted-foreground">
          平均{" "}
          <span className="font-semibold tabular-nums text-foreground">
            ¥{Math.round(averageCost).toLocaleString()}
          </span>
          /日
        </span>
      </div>

      <div className="relative flex h-[140px] items-end gap-1.5">
        {/* Average dashed line */}
        {averageCost > 0 && (
          <div
            className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-brand-border"
            style={{
              bottom: `${(averageCost / maxCost) * 100}%`,
            }}
          >
            <span className="absolute -top-4 right-0 text-[10px] font-medium text-brand/50">
              平均
            </span>
          </div>
        )}

        {entries.map((entry, i) => {
          const heightPct = (entry.totalCost / maxCost) * 100;
          return (
            <div
              key={entry.date}
              className="group flex flex-1 flex-col items-center gap-1"
            >
              {/* Hover value tooltip */}
              <span className="min-h-[16px] text-[11px] font-semibold text-brand/80 opacity-0 transition-opacity group-hover:opacity-100">
                {entry.totalCost > 0
                  ? `¥${Math.round(entry.totalCost).toLocaleString()}`
                  : ""}
              </span>
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className={cn(
                    "w-full max-w-[32px] rounded-t-md transition-all duration-200",
                    "bg-gradient-to-t from-brand to-brand/70",
                    "group-hover:from-brand group-hover:to-brand/70 group-hover:shadow-md",
                  )}
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                />
              </div>
              {/* Day label */}
              <span className="text-[11px] font-medium text-muted-foreground">
                {DAY_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { WeeklyCostChart };
