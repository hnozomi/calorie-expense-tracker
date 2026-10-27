import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getToday } from "@/lib/today";
import { getMondayOf, parseWeekParam } from "@/utils";
import { PlanContent } from "./plan-content";
import { PlanSkeleton } from "./plan-skeleton";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Decide the week from ?week= (this week when absent, any day moves to its Monday); a value that is not a date is a 404 */
export const PlanSection = async ({ searchParams }: Props) => {
  const parsed = parseWeekParam((await searchParams).week);
  if (parsed.status === "invalid") notFound();
  const today = await getToday();
  const thisMonday = getMondayOf(today);
  const weekStart = parsed.status === "valid" ? parsed.value : thisMonday;

  return (
    // Keyed by the week: moving to another week shows the skeleton again instead of the previous week's plans
    <Suspense key={weekStart} fallback={<PlanSkeleton />}>
      <PlanContent
        weekStart={weekStart}
        thisMonday={thisMonday}
        today={today}
      />
    </Suspense>
  );
};
