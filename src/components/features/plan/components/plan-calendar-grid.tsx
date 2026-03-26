"use client";

import { PfcDisplay } from "@/components/ui/pfc-display";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useNutritionTarget } from "@/hooks";
import { MEAL_TYPE_LABELS } from "@/types";
import { buildWeekDays, cn, getTodayString } from "@/utils";
import type { MealPlan } from "../types/meal-plan";
import { PlanCell } from "./plan-cell";

/** Meal types displayed in the calendar (exclude snack for grid simplicity) */
const CALENDAR_MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;

type PlanCalendarGridProps = {
  weekStart: string;
  plans: MealPlan[];
};

type DailyTotals = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  cost: number;
};

const EMPTY_TOTALS: DailyTotals = {
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  cost: 0,
};

const buildPlanIndex = (plans: MealPlan[]) => {
  const plansBySlot = new Map<string, MealPlan[]>();
  const totalsByDate = new Map<string, DailyTotals>();

  for (const plan of plans) {
    const slotKey = `${plan.date}:${plan.mealType}`;
    const existingSlotPlans = plansBySlot.get(slotKey);
    if (existingSlotPlans) {
      existingSlotPlans.push(plan);
    } else {
      plansBySlot.set(slotKey, [plan]);
    }

    const currentTotals = totalsByDate.get(plan.date) ?? EMPTY_TOTALS;
    totalsByDate.set(plan.date, {
      calories: currentTotals.calories + plan.calories,
      protein: currentTotals.protein + plan.protein,
      fat: currentTotals.fat + plan.fat,
      carbs: currentTotals.carbs + plan.carbs,
      cost: currentTotals.cost + plan.estimatedCost,
    });
  }

  return { plansBySlot, totalsByDate };
};

/** Horizontally scrollable 7-day × 3-meal grid with daily calorie totals */
const PlanCalendarGrid = ({ weekStart, plans }: PlanCalendarGridProps) => {
  const days = buildWeekDays(weekStart);
  const { data: target } = useNutritionTarget();
  const targetCalories = target?.targetCalories ?? 0;
  const hasTarget = targetCalories > 0;
  const { plansBySlot, totalsByDate } = buildPlanIndex(plans);
  const todayStr = getTodayString();
  const dailyCalories = days.map(
    (day) => (totalsByDate.get(day.date) ?? EMPTY_TOTALS).calories,
  );
  const maxCal = Math.max(...dailyCalories, 1);

  return (
    <ScrollArea className="w-full">
      <div className="min-w-[640px]">
        {/* Header row: day labels */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/60 bg-muted/30">
          <div className="p-2" />
          {days.map((day) => {
            const isToday = day.date === todayStr;
            return (
              <div
                key={day.date}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2",
                  isToday && "bg-primary/5",
                )}
              >
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {day.dayOfWeek}
                </p>
                <p
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground",
                  )}
                >
                  {day.label.split("/")[1]}
                </p>
              </div>
            );
          })}
        </div>

        {/* Meal type rows */}
        {CALENDAR_MEAL_TYPES.map((mealType) => (
          <div
            key={mealType}
            className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/40"
          >
            <div className="flex items-center justify-center border-r border-border/40 bg-muted/20 p-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {MEAL_TYPE_LABELS[mealType]}
              </span>
            </div>
            {days.map((day) => {
              const isToday = day.date === todayStr;
              return (
                <div
                  key={`${day.date}-${mealType}`}
                  className={cn(
                    "min-w-0 overflow-hidden border-r border-border/30 last:border-r-0",
                    isToday && "bg-primary/[0.02]",
                  )}
                >
                  <PlanCell
                    date={day.date}
                    mealType={mealType}
                    plans={plansBySlot.get(`${day.date}:${mealType}`) ?? []}
                  />
                </div>
              );
            })}
          </div>
        ))}

        {/* Daily calorie totals row */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-center border-r border-border/40 p-1">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground">
              合計
            </span>
          </div>
          {days.map((day, i) => {
            const totals = totalsByDate.get(day.date) ?? EMPTY_TOTALS;
            const cal = dailyCalories[i];
            const isToday = day.date === todayStr;
            const isOver = hasTarget && cal > targetCalories;
            const isLow = hasTarget && cal > 0 && cal < targetCalories * 0.8;

            /** Relative intensity for background coloring */
            const intensity = maxCal > 0 ? cal / maxCal : 0;

            return (
              <div
                key={`total-${day.date}`}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 border-r border-border/30 py-2 last:border-r-0",
                  isToday && "bg-primary/[0.02]",
                )}
              >
                {cal > 0 ? (
                  <>
                    <span
                      className={cn(
                        "text-xs font-bold tabular-nums",
                        isOver
                          ? "text-destructive"
                          : isLow
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-foreground",
                      )}
                    >
                      {Math.round(cal)}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      kcal
                    </span>
                    {/* Mini bar showing relative amount */}
                    <div className="mt-0.5 h-1 w-10 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isOver
                            ? "bg-destructive"
                            : isLow
                              ? "bg-amber-400"
                              : "bg-brand",
                        )}
                        style={{ width: `${Math.min(intensity * 100, 100)}%` }}
                      />
                    </div>
                    <PfcDisplay
                      protein={totals.protein}
                      fat={totals.fat}
                      carbs={totals.carbs}
                      className="mt-1 flex-col gap-0 text-[9px]"
                      precision={0}
                    />
                    {totals.cost > 0 && (
                      <span className="mt-0.5 text-[9px] font-medium tabular-nums text-muted-foreground">
                        ¥{Math.round(totals.cost).toLocaleString()}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] text-muted-foreground/40">
                    —
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export { PlanCalendarGrid };
