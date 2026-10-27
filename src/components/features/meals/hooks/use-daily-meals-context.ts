"use client";

import { createContext, useContext, useMemo, useOptimistic } from "react";
import type {
  DailyMealGroup,
  DailySummaryRow,
  DisplayedDailyMeals,
  MealChange,
} from "../types/meal";
import { adjustSummaryRows } from "../utils/adjust-summary-rows";
import {
  applyMealChange,
  toDisplayedDailyMeals,
} from "../utils/apply-meal-change";

type DailyMealsContextValue = {
  /** The day the home screen shows (YYYY-MM-DD) */
  date: string;
  /** Today in Asia/Tokyo, decided on the server */
  today: string;
  /** Items as shown, including changes still being saved */
  meals: DisplayedDailyMeals;
  /** Items as the server last returned them */
  confirmedMeals: DisplayedDailyMeals;
  /** Show a change before the server confirms it. Call inside a transition; it is undone when the transition ends */
  showMealChange: (change: MealChange) => void;
};

export const DailyMealsContext = createContext<DailyMealsContextValue | null>(
  null,
);

/** The slots and the register drawer share the day's items, so a registration shows in the slot at once */
export const useDailyMealsProviderValue = (
  date: string,
  today: string,
  meals: DailyMealGroup,
): DailyMealsContextValue => {
  const confirmedMeals = useMemo(() => toDisplayedDailyMeals(meals), [meals]);
  const [optimisticMeals, showMealChange] = useOptimistic(
    confirmedMeals,
    applyMealChange,
  );
  return {
    date,
    today,
    meals: optimisticMeals,
    confirmedMeals,
    showMealChange,
  };
};

export const useDailyMealsContext = (): DailyMealsContextValue => {
  const value = useContext(DailyMealsContext);
  if (!value) {
    throw new Error(
      "useDailyMealsContext must be used inside DailyMealsProvider",
    );
  }
  return value;
};

/** The server's summary rows, moved by the changes still being saved */
export const useDisplayedSummaryRows = (
  summaryRows: DailySummaryRow[],
): DailySummaryRow[] => {
  const { meals, confirmedMeals } = useDailyMealsContext();
  return useMemo(
    () => adjustSummaryRows(summaryRows, confirmedMeals, meals),
    [summaryRows, confirmedMeals, meals],
  );
};
