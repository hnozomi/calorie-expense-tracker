"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Header, PageContainer } from "@/components/features/layout";
import { Button } from "@/components/ui/button";
import { useWeekStartNavigation } from "@/hooks";
import { formatWeekLabel, getThisMonday } from "@/utils";
import { useMealPlans } from "../hooks/use-meal-plans";
import { planWeekStartAtom } from "../stores/plan-week-atom";
import { PlanCalendarGrid } from "./plan-calendar-grid";
import { PlanWeeklySummary } from "./plan-weekly-summary";

/** Main view for the meal planning calendar */
const PlanCalendarView = () => {
  const {
    value: weekStart,
    shiftBackward,
    shiftForward,
  } = useWeekStartNavigation(planWeekStartAtom, getThisMonday());
  const { data: plans } = useMealPlans(weekStart);
  const weekLabel = formatWeekLabel(weekStart);
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
            onClick={shiftBackward}
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
            onClick={shiftForward}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <PlanCalendarGrid weekStart={weekStart} plans={plans} />
        <div className="px-4 pb-4 pt-3">
          <PlanWeeklySummary plans={plans} weekStart={weekStart} />
        </div>
      </PageContainer>
    </>
  );
};

export { PlanCalendarView };
