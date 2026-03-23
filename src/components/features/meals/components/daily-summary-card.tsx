"use client";

import { Flame, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNutritionTarget } from "@/hooks";
import { cn } from "@/utils";
import { useDailySummary } from "../hooks/use-daily-summary";
import type { DailySummaryRow } from "../types/meal";
import { sumNutrition } from "../utils/nutrition-calc";

type DailySummaryCardProps = {
  date: string;
};

/** Circular progress ring for calorie target */
const CalorieRing = ({
  current,
  target,
}: {
  current: number;
  target: number;
}) => {
  const ratio = target > 0 ? Math.min(current / target, 1.2) : 0;
  const isOver = current > target && target > 0;
  const circumference = 2 * Math.PI * 38;
  const dashOffset = circumference * (1 - Math.min(ratio, 1));

  return (
    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
      <svg
        className="h-20 w-20 -rotate-90"
        viewBox="0 0 80 80"
        role="img"
        aria-label="カロリー進捗"
      >
        <circle
          cx="40"
          cy="40"
          r="38"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-brand-border/60"
        />
        <circle
          cx="40"
          cy="40"
          r="38"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={cn(
            "transition-all duration-500",
            isOver ? "text-destructive" : "text-brand",
          )}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <Flame
          className={cn(
            "h-3.5 w-3.5",
            isOver ? "text-destructive" : "text-brand",
          )}
        />
        <p className="text-lg font-extrabold leading-tight tracking-tight">
          {Math.round(current)}
        </p>
        <p className="text-[9px] font-medium text-muted-foreground">kcal</p>
      </div>
    </div>
  );
};

/** Single PFC progress bar row */
const PfcBar = ({
  label,
  current,
  target,
  color,
  bgColor,
  textColor,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
  bgColor: string;
  textColor: string;
}) => {
  const ratio = target > 0 ? Math.min(current / target, 1) : 0;
  const remaining = Math.max(target - current, 0);
  const isOver = current > target && target > 0;

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className={cn("font-semibold", textColor)}>{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {current.toFixed(1)}
          {target > 0 && (
            <>
              <span className="text-muted-foreground/60"> / {target}g</span>
              <span
                className={cn(
                  "ml-1 font-medium",
                  isOver ? "text-destructive" : textColor,
                )}
              >
                {isOver
                  ? `+${(current - target).toFixed(1)}`
                  : `あと${remaining.toFixed(1)}`}
              </span>
            </>
          )}
        </span>
      </div>
      {target > 0 && (
        <div className={cn("h-1.5 overflow-hidden rounded-full", bgColor)}>
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isOver ? "bg-destructive" : color,
            )}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};

/** Display total calories, PFC, cost, and remaining intake for the day */
const DailySummaryCard = ({ date }: DailySummaryCardProps) => {
  const { data: summaryRows } = useDailySummary(date);
  const { data: target } = useNutritionTarget();

  const rows: DailySummaryRow[] = summaryRows ?? [];
  const nutrition = sumNutrition(rows);
  const totalCost = rows.reduce((sum, row) => sum + row.totalCost, 0);

  const targetCalories = target?.targetCalories ?? 0;
  const targetProtein = target?.targetProtein ?? 0;
  const targetFat = target?.targetFat ?? 0;
  const targetCarbs = target?.targetCarbs ?? 0;
  const hasTarget = targetCalories > 0;

  const remainingCalories = Math.max(targetCalories - nutrition.calories, 0);

  return (
    <Card className="mx-4 overflow-hidden bg-gradient-to-br from-brand-muted to-brand-muted/50 shadow-md dark:from-brand-muted dark:to-brand-muted/50">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          {/* Calorie ring or simple display */}
          {hasTarget ? (
            <CalorieRing current={nutrition.calories} target={targetCalories} />
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted dark:bg-brand/20">
                <Flame className="h-5 w-5 text-brand" />
              </div>
              <div>
                <p className="text-3xl font-extrabold tracking-tight text-foreground">
                  {Math.round(nutrition.calories)}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  kcal
                </p>
              </div>
            </div>
          )}

          {/* Right side: remaining + cost */}
          <div className="flex-1">
            {hasTarget && (
              <div className="mb-1">
                <p className="text-xs text-muted-foreground">
                  あと
                  <span className="mx-1 text-base font-bold text-foreground">
                    {Math.round(remainingCalories)}
                  </span>
                  kcal
                </p>
              </div>
            )}
            <div className="flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 dark:bg-white/10">
              <Wallet className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-semibold">
                ¥{Math.round(totalCost).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* PFC progress bars */}
        <div className="mt-3 space-y-2 border-t border-brand-border pt-3 dark:border-brand-border">
          <PfcBar
            label="P たんぱく質"
            current={nutrition.protein}
            target={targetProtein}
            color="bg-blue-500"
            bgColor="bg-blue-200/60 dark:bg-blue-900/30"
            textColor="text-blue-600 dark:text-blue-400"
          />
          <PfcBar
            label="F 脂質"
            current={nutrition.fat}
            target={targetFat}
            color="bg-amber-500"
            bgColor="bg-amber-200/60 dark:bg-amber-900/30"
            textColor="text-amber-600 dark:text-amber-400"
          />
          <PfcBar
            label="C 炭水化物"
            current={nutrition.carbs}
            target={targetCarbs}
            color="bg-green-500"
            bgColor="bg-green-200/60 dark:bg-green-900/30"
            textColor="text-green-600 dark:text-green-400"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export { DailySummaryCard };
