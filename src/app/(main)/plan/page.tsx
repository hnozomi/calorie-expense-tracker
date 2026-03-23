import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { PlanCalendarView } from "@/components/features/plan";
import { Skeleton } from "@/components/ui/skeleton";
import { getQueryClient } from "@/lib/get-query-client";
import { prefetchMealPlans, prefetchNutritionTarget } from "@/lib/prefetch";
import { createClient } from "@/lib/supabase/server";
import { getThisMonday, isValidDateString } from "@/utils";

type PlanPageProps = {
  searchParams?: Promise<{
    weekStart?: string | string[];
  }>;
};

/** Meal plan calendar page — prefetch this week's plans server-side */
export default async function PlanPage({ searchParams }: PlanPageProps) {
  const queryClient = getQueryClient();
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  const requestedWeekStart = resolvedSearchParams?.weekStart;
  const weekStart =
    typeof requestedWeekStart === "string" &&
    isValidDateString(requestedWeekStart)
      ? requestedWeekStart
      : getThisMonday();

  /** Prefetch data so dehydrate() captures it in the cache */
  await Promise.all([
    prefetchMealPlans(queryClient, supabase, weekStart),
    prefetchNutritionTarget(queryClient, supabase),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className="space-y-4 p-4">
            <Skeleton className="mx-auto h-8 w-40 rounded-full" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        }
      >
        <PlanCalendarView key={weekStart} initialWeekStart={weekStart} />
      </Suspense>
    </HydrationBoundary>
  );
}
