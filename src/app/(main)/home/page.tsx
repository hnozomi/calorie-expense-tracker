import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { DailyView } from "@/components/features/meals";
import { Skeleton } from "@/components/ui/skeleton";
import { getQueryClient } from "@/lib/get-query-client";
import {
  prefetchDailyMeals,
  prefetchDailySummary,
  prefetchNutritionTarget,
} from "@/lib/prefetch";
import { createClient } from "@/lib/supabase/server";
import { formatDateToString, isValidDateString } from "@/utils";

type HomePageProps = {
  searchParams?: Promise<{
    date?: string | string[];
  }>;
};

/** S-01: Home daily view page — prefetch today's data server-side */
export default async function HomePage({ searchParams }: HomePageProps) {
  const queryClient = getQueryClient();
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  const requestedDate = resolvedSearchParams?.date;
  const dateParam =
    typeof requestedDate === "string" && isValidDateString(requestedDate)
      ? requestedDate
      : formatDateToString(new Date());

  /** Prefetch data so dehydrate() captures it in the cache */
  await Promise.all([
    prefetchDailyMeals(queryClient, supabase, dateParam),
    prefetchDailySummary(queryClient, supabase, dateParam),
    prefetchNutritionTarget(queryClient, supabase),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className="space-y-4 p-4">
            <Skeleton className="mx-auto h-9 w-48 rounded-lg" />
            <Skeleton className="h-40 w-full rounded-xl" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        }
      >
        <DailyView key={dateParam} initialDate={dateParam} />
      </Suspense>
    </HydrationBoundary>
  );
}
