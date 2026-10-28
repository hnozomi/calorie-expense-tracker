import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getToday } from "@/lib/today";
import { getMondayOf, parseWeekParam } from "@/utils";
import { ReportContent } from "./report-content";
import { ReportSkeleton } from "./report-skeleton";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Decide the week from ?week= (this week when absent, any day moves to its Monday); a value that is not a date is a 404 */
export const ReportSection = async ({ searchParams }: Props) => {
  const parsed = parseWeekParam((await searchParams).week);
  if (parsed.status === "invalid") notFound();
  const thisMonday = getMondayOf(await getToday());
  const weekStart = parsed.status === "valid" ? parsed.value : thisMonday;

  return (
    // Keyed by the week: the weekly summary RPC is the slow part, so a new week shows the skeleton under the header
    <Suspense key={weekStart} fallback={<ReportSkeleton />}>
      <ReportContent weekStart={weekStart} thisMonday={thisMonday} />
    </Suspense>
  );
};
