"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks";
import { getDailySummaryQueryOptions } from "../queries";

/** Fetch daily summary (calories/PFC/cost per meal_type) via RPC */
export const useDailySummary = (date: string) => {
  const supabase = useSupabase();

  return useSuspenseQuery(getDailySummaryQueryOptions(supabase, date));
};
