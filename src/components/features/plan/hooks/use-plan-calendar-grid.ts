"use client";

import { buildWeekDays } from "@/utils";
import { buildPlanIndex } from "../utils/plan-index";
import { useWeeklyPlansContext } from "./use-weekly-plans-context";

export const usePlanCalendarGrid = () => {
  const { weekStart, today, plans } = useWeeklyPlansContext();
  const days = buildWeekDays(weekStart);
  const { plansBySlot, totalsByDate } = buildPlanIndex(plans);
  const maxCalories = Math.max(
    ...days.map((day) => totalsByDate.get(day.date)?.calories ?? 0),
    1,
  );
  return { days, today, plansBySlot, totalsByDate, maxCalories };
};
