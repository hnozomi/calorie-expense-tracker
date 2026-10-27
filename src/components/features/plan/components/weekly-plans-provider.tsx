"use client";
// Client because it holds the optimistic plans the grid, the summary and the dialogs share

import {
  useWeeklyPlansProviderValue,
  WeeklyPlansContext,
} from "@/components/features/plan/hooks/use-weekly-plans-context";
import type { MealPlan } from "@/components/features/plan/types/meal-plan";
import type { PlanCandidates } from "@/components/features/plan/types/plan-candidates";

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
