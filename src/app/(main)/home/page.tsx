import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { DailyView } from "@/components/features/meals";
import { getQueryClient } from "@/lib/get-query-client";
import {
  prefetchDailyMeals,
  prefetchDailySummary,
  prefetchNutritionTarget,
} from "@/lib/prefetch";
import { createClient } from "@/lib/supabase/server";
import { formatDateToString } from "@/utils";

/** S-01: Home daily view page — prefetch today's data server-side */
export default async function HomePage() {
  const queryClient = getQueryClient();
  const supabase = await createClient();
  const today = formatDateToString(new Date());

  await Promise.all([
    prefetchDailyMeals(queryClient, supabase, today),
    prefetchDailySummary(queryClient, supabase, today),
    prefetchNutritionTarget(queryClient, supabase),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DailyView />
    </HydrationBoundary>
  );
}
