"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  getDailyMealsQueryOptions,
  getDailySummaryQueryOptions,
} from "@/components/features/meals/queries";
import { getMealPlansQueryOptions } from "@/components/features/plan/queries";
import { getNutritionTargetQueryOptions } from "@/components/features/settings/queries";
import { useSupabase } from "@/hooks";
import { getThisMonday, getTodayString } from "@/utils";

/** Warm the suspense-query caches of the other tabs right after the app loads,
 *  so the first tap on each tab renders instantly instead of suspending */
const TabDataPrefetcher = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    const today = getTodayString();
    const weekStart = getThisMonday();

    // Fire-and-forget: prefetchQuery respects staleTime and dedupes
    // against queries the active tab already ran
    queryClient.prefetchQuery(getDailyMealsQueryOptions(supabase, today));
    queryClient.prefetchQuery(getDailySummaryQueryOptions(supabase, today));
    queryClient.prefetchQuery(getMealPlansQueryOptions(supabase, weekStart));
    queryClient.prefetchQuery(getNutritionTargetQueryOptions(supabase));
  }, [queryClient, supabase]);

  return null;
};

export { TabDataPrefetcher };
