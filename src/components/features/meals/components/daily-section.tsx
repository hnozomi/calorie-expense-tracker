import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getToday } from "@/lib/today";
import { parseDateParam } from "@/utils";
import { DailyContent } from "./daily-content";
import { DailySkeleton } from "./daily-skeleton";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Decide the day from ?date= (today when absent) and show it; a day that is not a date is a 404 */
export const DailySection = async ({ searchParams }: Props) => {
  const parsed = parseDateParam((await searchParams).date);
  if (parsed.status === "invalid") notFound();
  const today = await getToday();
  const date = parsed.status === "valid" ? parsed.value : today;

  return (
    // Keyed by the day: moving to another day shows the skeleton again instead of the previous day's numbers
    <Suspense key={date} fallback={<DailySkeleton />}>
      <DailyContent date={date} today={today} />
    </Suspense>
  );
};
