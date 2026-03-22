import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PlanCalendarView } from "@/components/features/plan";
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

  await Promise.all([
    prefetchMealPlans(queryClient, supabase, weekStart, weekEnd),
    prefetchNutritionTarget(queryClient, supabase),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlanCalendarView />
    </HydrationBoundary>
  );
}
