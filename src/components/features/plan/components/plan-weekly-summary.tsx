"use client";

import { Button } from "@/components/ui/button";
import { PfcDisplay } from "@/components/ui/pfc-display";
import type { MealType } from "@/types";
import { useTransferPlan } from "../hooks/use-transfer-plan";
import type { MealPlan } from "../types/meal-plan";

type PlanWeeklySummaryProps = {
  plans: MealPlan[];
  weekStart: string;
};

/** Weekly totals summary for planned meals with transfer action */
const PlanWeeklySummary = ({ plans, weekStart }: PlanWeeklySummaryProps) => {
  const transferMutation = useTransferPlan();

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

  /** Count untransferred plans */
  const untransferredCount = plans.filter((p) => !p.isTransferred).length;

  /** Transfer all untransferred plans for today */
  const handleTransferToday = async () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const todayStr = `${y}-${m}-${d}`;

    /** Find untransferred meal types for today */
    const todayMealTypes = [
      ...new Set(
        plans
          .filter((p) => p.date === todayStr && !p.isTransferred)
          .map((p) => p.mealType),
      ),
    ];

    for (const mealType of todayMealTypes) {
      await transferMutation.mutateAsync({
        targetDate: todayStr,
        mealType: mealType as MealType,
      });
    }
  };

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
        {untransferredCount > 0 && (
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

        {/* PFC display using shared component */}
        <PfcDisplay
          protein={totals.protein}
          fat={totals.fat}
          carbs={totals.carbs}
          size="md"
        />

        {/* Untransferred count badge */}
        {untransferredCount > 0 && (
          <p className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            未転記: {untransferredCount}件
          </p>
        )}
      </div>
    </div>
  );
};

export { PlanWeeklySummary };
