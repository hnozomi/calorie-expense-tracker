"use client";

import { useWeeklyPlansContext } from "@/components/features/plan/hooks/use-weekly-plans-context";
import {
  buildPlanIndex,
  EMPTY_TOTALS,
  rateDayCalories,
} from "@/components/features/plan/utils/plan-index";
import { buildWeekDays } from "@/utils";

export const usePlanCalendarGrid = (targetCalories: number) => {
  const { weekStart, today, plans } = useWeeklyPlansContext();
  const days = buildWeekDays(weekStart);
  const { plansBySlot, totalsByDate } = buildPlanIndex(plans);
  const maxCalories = Math.max(
    ...days.map((day) => totalsByDate.get(day.date)?.calories ?? 0),
    1,
  );
  const dayTotals = days.map((day) => {
    const totals = totalsByDate.get(day.date) ?? EMPTY_TOTALS;
    return {
      date: day.date,
      totals,
      isToday: day.date === today,
      rating: rateDayCalories(totals.calories, targetCalories, maxCalories),
    };
  });
  return { days, today, plansBySlot, dayTotals };
};
