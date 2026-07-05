"use client";

import { usePrefetchQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Header, PageContainer } from "@/components/features/layout";
import { getNutritionTargetQueryOptions } from "@/components/features/settings/queries";
import { Button } from "@/components/ui/button";
import { useSupabase, useWeekStartNavigation } from "@/hooks";
import { formatWeekLabel, getThisMonday } from "@/utils";
import { useMealPlans } from "../hooks/use-meal-plans";
import { planWeekStartAtom } from "../stores/plan-week-atom";
import { PlanCalendarGrid } from "./plan-calendar-grid";
import { PlanWeeklySummary } from "./plan-weekly-summary";

/** Main view for the meal planning calendar */
const PlanCalendarView = () => {
  const {
    value: weekStart,
    isDefaultValue: isCurrentWeek,
    setDate: setWeekStart,
    shiftBackward,
    shiftForward,
  } = useWeekStartNavigation(planWeekStartAtom, getThisMonday());
  const supabase = useSupabase();

  // Warm the nutrition target used by the grid and weekly summary before
  // useMealPlans suspends, so both requests run in parallel
  usePrefetchQuery(getNutritionTargetQueryOptions(supabase));

  const { data: plans } = useMealPlans(weekStart);
  const weekLabel = formatWeekLabel(weekStart);
  return (
    <>
      <Header title="献立カレンダー" />
      <PageContainer>
        {/* Week navigation */}
        <div className="relative flex items-center justify-center gap-2 py-4">
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
            {isCurrentWeek && (
              <span className="mr-1.5 text-xs font-bold text-primary">
                今週
              </span>
            )}
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
          {!isCurrentWeek && (
            <Button
              variant="outline"
              size="sm"
              className="absolute right-3 h-7 rounded-full px-2.5 text-xs"
              onClick={() => setWeekStart(getThisMonday())}
            >
              今週へ
            </Button>
          )}
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
