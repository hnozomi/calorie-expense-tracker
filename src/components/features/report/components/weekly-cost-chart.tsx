"use client";

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
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">食費</p>
        <p className="text-xs text-muted-foreground">
          合計 ¥{Math.round(totalCost)} (平均 ¥{Math.round(averageCost)}/日)
        </p>
      </div>
      <div className="flex items-end gap-1" style={{ height: 120 }}>
        {entries.map((entry, i) => {
          const heightPct = (entry.totalCost / maxCost) * 100;
          return (
            <div
              key={entry.date}
              className="group flex flex-1 flex-col items-center gap-1"
            >
              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
                ¥{Math.round(entry.totalCost)}
              </span>
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className="w-full max-w-[28px] rounded-t bg-orange-400/70 transition-colors hover:bg-orange-400"
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
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
