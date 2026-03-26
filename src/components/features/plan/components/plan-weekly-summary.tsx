"use client";

import { Button } from "@/components/ui/button";
import { PfcDisplay } from "@/components/ui/pfc-display";
import { useNutritionTarget } from "@/hooks";
import type { MealType } from "@/types";
import { cn, getTodayString } from "@/utils";
import { useTransferPlan } from "../hooks/use-transfer-plan";
import type { MealPlan } from "../types/meal-plan";

type PlanWeeklySummaryProps = {
  plans: MealPlan[];
  weekStart: string;
};

/** Weekly totals summary for planned meals with transfer action */
const PlanWeeklySummary = ({ plans, weekStart }: PlanWeeklySummaryProps) => {
  const transferMutation = useTransferPlan();
  const { data: target } = useNutritionTarget();

  /** Calculate weekly totals */
  const totals = plans.reduce(
    (acc, plan) => ({
      calories: acc.calories + plan.calories,
      protein: acc.protein + plan.protein,
      fat: acc.fat + plan.fat,
      carbs: acc.carbs + plan.carbs,
      cost: acc.cost + plan.estimatedCost,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0, cost: 0 },
  );

  /** Transfer today's plans to daily meals */
  const handleTransferToday = async () => {
    const todayStr = getTodayString();

    const todayMealTypes = [
      ...new Set(
        plans.filter((p) => p.date === todayStr).map((p) => p.mealType),
      ),
    ];

    for (const mealType of todayMealTypes) {
      await transferMutation.mutateAsync({
        targetDate: todayStr,
        mealType: mealType as MealType,
      });
    }
  };

  /** Calculate weekly calorie target vs actual */
  const dailyTarget = target?.targetCalories ?? 0;
  const weeklyTarget = dailyTarget * 7;
  const hasTarget = weeklyTarget > 0;
  const calorieDiff = Math.round(totals.calories - weeklyTarget);

  /** Check if today has any plans */
  const todayStr = getTodayString();
  const hasTodayPlans = plans.some((p) => p.date === todayStr);

  /** Build date range label */
  const endDate = new Date(`${weekStart}T00:00:00`);
  endDate.setDate(endDate.getDate() + 6);
  const startObj = new Date(`${weekStart}T00:00:00`);
  const rangeLabel = `${startObj.getMonth() + 1}/${startObj.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      {/* Header with title and transfer button */}
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-4 py-2.5">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground">
          週間サマリー ({rangeLabel})
        </p>
        {hasTodayPlans && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-full px-3 text-xs"
            onClick={handleTransferToday}
            disabled={transferMutation.isPending}
          >
            {transferMutation.isPending ? "転記中..." : "今日の献立を転記"}
          </Button>
        )}
      </div>

      {/* Stats body */}
      <div className="space-y-3 p-4">
        {/* Calories and cost in a prominent row */}
        <div className="flex items-baseline gap-6">
          <div>
            <p className="text-xs text-muted-foreground">カロリー</p>
            <p className="text-2xl font-bold tabular-nums tracking-tight">
              {Math.round(totals.calories)}
              <span className="ml-0.5 text-sm font-normal text-muted-foreground">
                kcal
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">食費</p>
            <p className="text-2xl font-bold tabular-nums tracking-tight">
              ¥{Math.round(totals.cost).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Weekly calorie target comparison */}
        {hasTarget && (
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                週間目標: {weeklyTarget.toLocaleString()} kcal
                <span className="ml-1 text-[10px]">
                  ({dailyTarget.toLocaleString()} × 7日)
                </span>
              </span>
              <span
                className={cn(
                  "font-bold tabular-nums",
                  calorieDiff > 0
                    ? "text-destructive"
                    : calorieDiff < 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-emerald-600 dark:text-emerald-400",
                )}
              >
                {calorieDiff > 0 ? "+" : ""}
                {calorieDiff.toLocaleString()} kcal
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  calorieDiff > 0 ? "bg-destructive" : "bg-brand",
                )}
                style={{
                  width: `${Math.min((totals.calories / weeklyTarget) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* PFC display using shared component */}
        <PfcDisplay
          protein={totals.protein}
          fat={totals.fat}
          carbs={totals.carbs}
          size="md"
        />
      </div>
    </div>
  );
};

export { PlanWeeklySummary };
