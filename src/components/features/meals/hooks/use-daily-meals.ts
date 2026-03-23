"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks";
import { getDailyMealsQueryOptions } from "../queries";

/** Fetch all meal items grouped by meal_type for a given date */
export const useDailyMeals = (date: string) => {
  const supabase = useSupabase();

  return useSuspenseQuery(getDailyMealsQueryOptions(supabase, date));
};
