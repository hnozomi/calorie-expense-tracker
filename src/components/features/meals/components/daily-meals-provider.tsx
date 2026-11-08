"use client";
// Client because it holds the optimistic state the slots and the register drawer share

import {
  DailyMealsContext,
  useDailyMealsProviderValue,
} from "@/components/features/meals/hooks/use-daily-meals-context";
import type { DailyMealGroup } from "@/components/features/meals/types/meal";

type Props = {
  date: string;
  today: string;
  meals: DailyMealGroup;
  children: React.ReactNode;
};

export const DailyMealsProvider = ({ date, today, meals, children }: Props) => {
  const value = useDailyMealsProviderValue(date, today, meals);
  return <DailyMealsContext value={value}>{children}</DailyMealsContext>;
};
