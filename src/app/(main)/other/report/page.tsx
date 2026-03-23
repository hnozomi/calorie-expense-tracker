import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { WeeklyReportView } from "@/components/features/report";
import { Skeleton } from "@/components/ui/skeleton";
import { getQueryClient } from "@/lib/get-query-client";
import { prefetchWeeklyReport } from "@/lib/prefetch";
import { createClient } from "@/lib/supabase/server";
import { getThisMonday } from "@/utils";

/** Weekly report page — prefetch this week's report server-side */
export default async function ReportPage() {
  const queryClient = getQueryClient();
  const supabase = await createClient();
  const weekStart = getThisMonday();

  /** Prefetch data so dehydrate() captures it in the cache */
  await prefetchWeeklyReport(queryClient, supabase, weekStart);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className="space-y-4 px-4 pt-4">
            <Skeleton className="mx-auto h-8 w-40 rounded-full" />
            <Skeleton className="h-52 w-full rounded-xl" />
            <Skeleton className="h-52 w-full rounded-xl" />
            <Skeleton className="h-52 w-full rounded-xl" />
          </div>
        }
      >
        <WeeklyReportView />
      </Suspense>
    </HydrationBoundary>
  );
}
