"use client";

// Client because it follows the plans still being saved and runs the transfer and sync actions

import { usePlanWeeklySummary } from "@/components/features/plan/hooks/use-plan-weekly-summary";
import { Button } from "@/components/ui/button";
import { PfcDisplay } from "@/components/ui/pfc-display";
import { SyncActualsButton } from "./sync-actuals-button";
import { WeeklyTargetBar } from "./weekly-target-bar";

type Props = {
  targetCalories: number;
};

export const PlanWeeklySummary = ({ targetCalories }: Props) => {
  const summary = usePlanWeeklySummary(targetCalories);

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-muted/30 px-4 py-2.5">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground">
          週間サマリー ({summary.rangeLabel})
        </p>
        <div className="flex items-center gap-1.5">
          {summary.hasPastDays && (
            <SyncActualsButton
              isSyncing={summary.isSyncing}
              onConfirm={summary.handleSyncActuals}
            />
          )}
          {summary.hasTodayPlans && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-full px-3 text-xs"
              onClick={summary.handleTransferToday}
              disabled={summary.isTransferring}
            >
              {summary.isTransferring ? "転記中..." : "今日の献立を転記"}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-baseline gap-6">
          <div>
            <p className="text-xs text-muted-foreground">カロリー</p>
            <p className="text-2xl font-bold tabular-nums tracking-tight">
              {Math.round(summary.totals.calories)}
              <span className="ml-0.5 text-sm font-normal text-muted-foreground">
                kcal
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">食費</p>
            <p className="text-2xl font-bold tabular-nums tracking-tight">
              ¥{Math.round(summary.totals.cost).toLocaleString()}
            </p>
          </div>
        </div>

        {summary.hasTarget && (
          <WeeklyTargetBar
            weeklyTarget={summary.weeklyTarget}
            dailyTarget={targetCalories}
            plannedDayCount={summary.plannedDayCount}
            calorieDiff={summary.calorieDiff}
            plannedCalories={summary.totals.calories}
          />
        )}

        <PfcDisplay
          protein={summary.totals.protein}
          fat={summary.totals.fat}
          carbs={summary.totals.carbs}
          size="md"
        />
      </div>
    </div>
  );
};
