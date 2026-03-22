"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PfcDot } from "@/components/ui/pfc-display";
import { cn } from "@/utils";
import type { DailyReportEntry } from "../types/weekly-report";

type WeeklyPfcChartProps = {
  entries: DailyReportEntry[];
  averageProtein: number;
  averageFat: number;
  averageCarbs: number;
};

/** Day of week labels */
const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

/** PFC color codes matching the design system */
const PFC_COLORS = {
  protein: "bg-blue-500",
  fat: "bg-amber-500",
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
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <PfcDot color="bg-blue-500" />
          <span className="font-medium text-blue-600 dark:text-blue-400">
            タンパク質
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <PfcDot color="bg-amber-500" />
          <span className="font-medium text-amber-600 dark:text-amber-400">
            脂質
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <PfcDot color="bg-green-500" />
          <span className="font-medium text-green-600 dark:text-green-400">
            炭水化物
          </span>
        </span>
      </div>

      {/* Stacked bars */}
      <div className="flex h-[140px] items-end gap-1.5">
        {entries.map((entry, i) => {
          const total = entry.protein + entry.fat + entry.carbs;
          const heightPct = (total / maxTotal) * 100;
          const pPct = total > 0 ? (entry.protein / total) * 100 : 0;
          const fPct = total > 0 ? (entry.fat / total) * 100 : 0;
          const cPct = total > 0 ? (entry.carbs / total) * 100 : 0;

          return (
            <div
              key={entry.date}
              className="group flex flex-1 flex-col items-center gap-1"
            >
              {/* Hover total */}
              <span className="min-h-[16px] text-[11px] font-semibold text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                {total > 0 ? `${Math.round(total)}g` : ""}
              </span>
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className="flex w-full max-w-[32px] flex-col overflow-hidden rounded-t-md transition-all duration-200 group-hover:shadow-md"
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                >
                  <div
                    className={cn(PFC_COLORS.carbs, "transition-all")}
                    style={{ height: `${cPct}%` }}
                  />
                  <div
                    className={cn(PFC_COLORS.fat, "transition-all")}
                    style={{ height: `${fPct}%` }}
                  />
                  <div
                    className={cn(PFC_COLORS.protein, "transition-all")}
                    style={{ height: `${pPct}%` }}
                  />
                </div>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                {DAY_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Expand/Collapse toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-full gap-1 rounded-lg text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <>
            閉じる <ChevronUp className="h-3.5 w-3.5" />
          </>
        ) : (
          <>
            平均値を表示 <ChevronDown className="h-3.5 w-3.5" />
          </>
        )}
      </Button>

      {/* Expanded averages */}
      {isExpanded && (
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-border/40 bg-muted/20 p-3 text-xs">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <PfcDot color="bg-blue-500" />
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                P
              </span>
            </div>
            <p className="text-sm font-bold tabular-nums">
              {averageProtein.toFixed(1)}
              <span className="text-[10px] font-normal text-muted-foreground">
                g/日
              </span>
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <PfcDot color="bg-amber-500" />
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                F
              </span>
            </div>
            <p className="text-sm font-bold tabular-nums">
              {averageFat.toFixed(1)}
              <span className="text-[10px] font-normal text-muted-foreground">
                g/日
              </span>
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <PfcDot color="bg-green-500" />
              <span className="font-semibold text-green-600 dark:text-green-400">
                C
              </span>
            </div>
            <p className="text-sm font-bold tabular-nums">
              {averageCarbs.toFixed(1)}
              <span className="text-[10px] font-normal text-muted-foreground">
                g/日
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export { WeeklyPfcChart };
