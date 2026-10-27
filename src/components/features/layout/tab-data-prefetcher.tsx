"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getMealPlansQueryOptions } from "@/components/features/plan/queries";
import { getNutritionTargetQueryOptions } from "@/components/features/settings/queries";
import { useSupabase } from "@/hooks";
import { getThisMonday } from "@/utils";

/** Warm the suspense-query caches of the tabs still read in the browser right after the app loads (home now reads on the server),
 *  so the first tap on each tab renders instantly instead of suspending */
const TabDataPrefetcher = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    const weekStart = getThisMonday();

    // Fire-and-forget: prefetchQuery respects staleTime and dedupes
    // against queries the active tab already ran
    queryClient.prefetchQuery(getMealPlansQueryOptions(supabase, weekStart));
    queryClient.prefetchQuery(getNutritionTargetQueryOptions(supabase));
  }, [queryClient, supabase]);

  return null;
};

export { TabDataPrefetcher };
