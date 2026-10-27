"use client";
// Client because it holds the optimistic plans the grid, the summary and the dialogs share

import {
  useWeeklyPlansProviderValue,
  WeeklyPlansContext,
} from "../hooks/use-weekly-plans-context";
import type { MealPlan } from "../types/meal-plan";
import type { PlanCandidates } from "../types/plan-candidates";

type Props = {
  weekStart: string;
  today: string;
  plans: MealPlan[];
  candidates: Promise<PlanCandidates>;
  children: React.ReactNode;
};

export const WeeklyPlansProvider = ({
  weekStart,
  today,
  plans,
  candidates,
  children,
}: Props) => {
  const value = useWeeklyPlansProviderValue(
    weekStart,
    today,
    plans,
    candidates,
  );
  return <WeeklyPlansContext value={value}>{children}</WeeklyPlansContext>;
};
