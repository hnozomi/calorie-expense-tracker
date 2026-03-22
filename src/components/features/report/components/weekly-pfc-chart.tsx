"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { DailyReportEntry } from "../types/weekly-report";

type WeeklyPfcChartProps = {
  entries: DailyReportEntry[];
  averageProtein: number;
  averageFat: number;
  averageCarbs: number;
};

/** Day of week labels */
const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

/** PFC color codes */
const PFC_COLORS = {
  protein: "bg-blue-500",
  fat: "bg-yellow-500",
  carbs: "bg-green-500",
} as const;

/** Stacked bar chart showing PFC balance per day */
const WeeklyPfcChart = ({
  entries,
  averageProtein,
  averageFat,
  averageCarbs,
}: WeeklyPfcChartProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  /** Find max total PFC for scaling */
  const maxTotal = Math.max(
    ...entries.map((e) => e.protein + e.fat + e.carbs),
    1,
  );

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">PFCバランス</p>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1 py-0 text-xs"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "閉じる" : "詳細"}
        </Button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />P
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-yellow-500" />
          F
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />C
        </span>
      </div>

      {/* Stacked bars */}
      <div className="flex items-end gap-1" style={{ height: 120 }}>
        {entries.map((entry, i) => {
          const total = entry.protein + entry.fat + entry.carbs;
          const heightPct = (total / maxTotal) * 100;
          const pPct = total > 0 ? (entry.protein / total) * 100 : 0;
          const fPct = total > 0 ? (entry.fat / total) * 100 : 0;
          const cPct = total > 0 ? (entry.carbs / total) * 100 : 0;

          return (
            <div
              key={entry.date}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className="flex w-full max-w-[28px] flex-col overflow-hidden rounded-t"
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                >
                  <div
                    className={PFC_COLORS.carbs}
                    style={{ height: `${cPct}%` }}
                  />
                  <div
                    className={PFC_COLORS.fat}
                    style={{ height: `${fPct}%` }}
                  />
                  <div
                    className={PFC_COLORS.protein}
                    style={{ height: `${pPct}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {DAY_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Expanded averages */}
      {isExpanded && (
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/30 p-2 text-xs">
          <div className="text-center">
            <p className="font-medium text-blue-600">P</p>
            <p>{averageProtein.toFixed(1)}g/日</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-yellow-600">F</p>
            <p>{averageFat.toFixed(1)}g/日</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-green-600">C</p>
            <p>{averageCarbs.toFixed(1)}g/日</p>
          </div>
        </div>
      )}
    </div>
  );
};

export { WeeklyPfcChart };
