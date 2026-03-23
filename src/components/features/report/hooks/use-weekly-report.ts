"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks";
import { getWeeklyReportQueryOptions } from "../queries";

/** Fetch weekly summary via RPC and compute averages */
export const useWeeklyReport = (weekStart: string) => {
  const supabase = useSupabase();

  return useSuspenseQuery(getWeeklyReportQueryOptions(supabase, weekStart));
};
