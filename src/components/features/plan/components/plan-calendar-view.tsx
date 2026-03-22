"use client";

import { useAtom } from "jotai";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Header, PageContainer } from "@/components/features/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { shiftDate } from "@/utils";
import { useMealPlans } from "../hooks/use-meal-plans";
import { planWeekStartAtom } from "../stores/plan-week-atom";
import { PlanCalendarGrid } from "./plan-calendar-grid";
import { PlanWeeklySummary } from "./plan-weekly-summary";

/** Main view for the meal planning calendar */
const PlanCalendarView = () => {
  const [weekStart, setWeekStart] = useAtom(planWeekStartAtom);
  const { data: plans, isLoading } = useMealPlans(weekStart);

  /** Build week label */
  const startObj = new Date(`${weekStart}T00:00:00`);
  const endObj = new Date(`${weekStart}T00:00:00`);
  endObj.setDate(endObj.getDate() + 6);
  const weekLabel = `${startObj.getMonth() + 1}/${startObj.getDate()} - ${endObj.getMonth() + 1}/${endObj.getDate()}`;

  return (
    <>
      <Header title="献立カレンダー" />
      <PageContainer>
        {/* Week navigation */}
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="前の週"
            className="h-8 w-8 rounded-full transition-colors hover:bg-muted"
            onClick={() => setWeekStart(shiftDate(weekStart, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] rounded-full bg-muted/60 px-4 py-1.5 text-center text-sm font-semibold tracking-wide">
            {weekLabel}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="次の週"
            className="h-8 w-8 rounded-full transition-colors hover:bg-muted"
            onClick={() => setWeekStart(shiftDate(weekStart, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar grid */}
        {isLoading ? (
          <div className="space-y-3 px-4 py-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        ) : (
          <>
            <PlanCalendarGrid weekStart={weekStart} plans={plans ?? []} />
            <div className="px-4 pb-4 pt-3">
              <PlanWeeklySummary plans={plans ?? []} weekStart={weekStart} />
            </div>
          </>
        )}
      </PageContainer>
    </>
  );
};

export { PlanCalendarView };
