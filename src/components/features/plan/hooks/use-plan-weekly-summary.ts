"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  syncMealsToPlans,
  transferPlansToMeals,
} from "@/components/features/plan/api/actions";
import { callAction } from "@/lib/action-result";
import { formatMonthDay, shiftDate } from "@/utils";
import { useWeeklyPlansContext } from "./use-weekly-plans-context";

/** Weekly totals against the target, plus moving today's plans into the meal record and actual meals into past plans */
export const usePlanWeeklySummary = (targetCalories: number) => {
  const { weekStart, today, plans } = useWeeklyPlansContext();
  const [isTransferring, startTransfer] = useTransition();
  const [isSyncing, startSync] = useTransition();

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

  // Compare against planned days only, so a half-planned week doesn't read as "under target"
  const plannedDayCount = new Set(plans.map((plan) => plan.date)).size;
  const weeklyTarget = targetCalories * plannedDayCount;

  const todayMealTypes = [
    ...new Set(
      plans.filter((plan) => plan.date === today).map((plan) => plan.mealType),
    ),
  ];

  // Past days of the displayed week, up to yesterday
  const weekEnd = shiftDate(weekStart, 6);
  const yesterday = shiftDate(today, -1);
  const syncEndDate = weekEnd < yesterday ? weekEnd : yesterday;

  const handleTransferToday = () => {
    startTransfer(async () => {
      const result = await callAction(() =>
        transferPlansToMeals({ date: today, mealTypes: todayMealTypes }),
      );
      const transferredCount = result.ok ? result.transferredCount : 0;
      if (transferredCount === todayMealTypes.length) {
        toast.success("今日の献立を食事記録に転記しました");
        return;
      }
      toast.error(
        transferredCount > 0
          ? `転記に失敗しました(${transferredCount}/${todayMealTypes.length}件は転記済み)`
          : "転記に失敗しました",
      );
    });
  };

  const handleSyncActuals = () => {
    startSync(async () => {
      const result = await callAction(() =>
        syncMealsToPlans({ startDate: weekStart, endDate: syncEndDate }),
      );
      if (!result.ok) {
        toast.error("実績の反映に失敗しました");
        return;
      }
      if (result.replacedCount === 0) {
        toast.info("反映できる食事記録がありませんでした");
        return;
      }
      toast.success(
        `${result.replacedCount}枠の献立を実際の食事内容で置き換えました`,
      );
    });
  };

  return {
    totals,
    rangeLabel: `${formatMonthDay(weekStart)} - ${formatMonthDay(weekEnd)}`,
    hasTarget: targetCalories > 0 && plannedDayCount > 0,
    weeklyTarget,
    plannedDayCount,
    calorieDiff: Math.round(totals.calories - weeklyTarget),
    hasTodayPlans: todayMealTypes.length > 0,
    hasPastDays: syncEndDate >= weekStart,
    isTransferring,
    isSyncing,
    handleTransferToday,
    handleSyncActuals,
  };
};
