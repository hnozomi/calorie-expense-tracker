"use client";

import { Button } from "@/components/ui/button";
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
    <div className="space-y-3 rounded-lg bg-muted/50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">週間合計 ({rangeLabel})</p>
        {untransferredCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleTransferToday}
            disabled={transferMutation.isPending}
          >
            {transferMutation.isPending ? "転記中..." : "今日の献立を転記"}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">カロリー: </span>
          <span className="font-medium">
            {Math.round(totals.calories)} kcal
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">食費: </span>
          <span className="font-medium">¥{Math.round(totals.cost)}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        P:{totals.protein.toFixed(1)} F:{totals.fat.toFixed(1)} C:
        {totals.carbs.toFixed(1)}
      </p>
      {untransferredCount > 0 && (
        <p className="text-xs text-muted-foreground">
          未転記: {untransferredCount}件
        </p>
      )}
    </div>
  );
};

export { PlanWeeklySummary };
