import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { WeeklyReportView } from "@/components/features/report";
import { getQueryClient } from "@/lib/get-query-client";
import { prefetchWeeklyReport } from "@/lib/prefetch";
import { createClient } from "@/lib/supabase/server";
import { getThisMonday } from "@/utils";

/** Weekly report page — prefetch this week's report server-side */
export default async function ReportPage() {
  const queryClient = getQueryClient();
  const supabase = await createClient();
  const weekStart = getThisMonday();

  await prefetchWeeklyReport(queryClient, supabase, weekStart);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WeeklyReportView />
    </HydrationBoundary>
  );
}
