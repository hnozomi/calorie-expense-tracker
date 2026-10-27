"use client";

import { createContext, useContext, useOptimistic } from "react";
import type {
  DisplayedMealPlan,
  MealPlan,
  PlanChange,
} from "../types/meal-plan";
import type { PlanCandidates } from "../types/plan-candidates";
import { applyPlanChange } from "../utils/apply-plan-change";

type WeeklyPlansContextValue = {
  weekStart: string;
  /** Today in Asia/Tokyo, decided on the server */
  today: string;
  plans: DisplayedMealPlan[];
  /** Show a change before the server confirms it. Call inside a transition; it is undone when the transition ends */
  showPlanChange: (change: PlanChange) => void;
  /** Read on the server with the week; the cell dialogs and the shopping list unwrap it with use() */
  candidates: Promise<PlanCandidates>;
};

export const WeeklyPlansContext = createContext<WeeklyPlansContextValue | null>(
  null,
);

/** The grid, the weekly summary and the dialogs share the week's plans, so a save shows everywhere at once */
export const useWeeklyPlansProviderValue = (
  weekStart: string,
  today: string,
  plans: MealPlan[],
  candidates: Promise<PlanCandidates>,
): WeeklyPlansContextValue => {
  const [optimisticPlans, showPlanChange] = useOptimistic<
    DisplayedMealPlan[],
    PlanChange
  >(plans, applyPlanChange);
  return {
    weekStart,
    today,
    plans: optimisticPlans,
    showPlanChange,
    candidates,
  };
};

export const useWeeklyPlansContext = (): WeeklyPlansContextValue => {
  const value = useContext(WeeklyPlansContext);
  if (!value) {
    throw new Error(
      "useWeeklyPlansContext must be used inside WeeklyPlansProvider",
    );
  }
  return value;
};
