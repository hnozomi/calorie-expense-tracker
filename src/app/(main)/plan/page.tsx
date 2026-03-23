import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { PlanCalendarView } from "@/components/features/plan";
import { Skeleton } from "@/components/ui/skeleton";
import { getQueryClient } from "@/lib/get-query-client";
import { prefetchMealPlans, prefetchNutritionTarget } from "@/lib/prefetch";
import { createClient } from "@/lib/supabase/server";
import { getThisMonday, shiftDate } from "@/utils";

/** Meal plan calendar page — prefetch this week's plans server-side */
export default async function PlanPage() {
  const queryClient = getQueryClient();
  const supabase = await createClient();
  const weekStart = getThisMonday();
  const weekEnd = shiftDate(weekStart, 6);

  /** Prefetch data so dehydrate() captures it in the cache */
  await Promise.all([
    prefetchMealPlans(queryClient, supabase, weekStart, weekEnd),
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
        <PlanCalendarView />
      </Suspense>
    </HydrationBoundary>
  );
}
