"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks";
import { getMealPlansQueryOptions } from "../queries";

/** Fetch meal plans for a given week (7 days starting from weekStart) */
export const useMealPlans = (weekStart: string) => {
  const supabase = useSupabase();

  return useSuspenseQuery(getMealPlansQueryOptions(supabase, weekStart));
};
