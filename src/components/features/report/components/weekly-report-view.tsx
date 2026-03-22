"use client";

import { useAtom } from "jotai";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Header, PageContainer } from "@/components/features/layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { shiftDate } from "@/utils";
import { useWeeklyReport } from "../hooks/use-weekly-report";
import { reportWeekStartAtom } from "../stores/report-week-atom";
import { WeeklyCalorieChart } from "./weekly-calorie-chart";
import { WeeklyCostChart } from "./weekly-cost-chart";
import { WeeklyPfcChart } from "./weekly-pfc-chart";

/** Main view for the weekly report */
const WeeklyReportView = () => {
  const [weekStart, setWeekStart] = useAtom(reportWeekStartAtom);
  const { data: report, isLoading } = useWeeklyReport(weekStart);

  /** Build week label */
  const startObj = new Date(`${weekStart}T00:00:00`);
  const endObj = new Date(`${weekStart}T00:00:00`);
  endObj.setDate(endObj.getDate() + 6);
  const weekLabel = `${startObj.getMonth() + 1}/${startObj.getDate()} - ${endObj.getMonth() + 1}/${endObj.getDate()}`;

  return (
    <>
      <Header title="ウィークリーレポート" />
      <PageContainer>
        {/* Week navigation */}
        <div className="flex items-center justify-center gap-4 py-3">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="前の週"
            onClick={() => setWeekStart(shiftDate(weekStart, -7))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="min-w-[120px] text-center font-medium">
            {weekLabel}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="次の週"
            onClick={() => setWeekStart(shiftDate(weekStart, 7))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {isLoading || !report ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="space-y-4 p-4">
            <WeeklyCalorieChart
              entries={report.entries}
              averageCalories={report.averageCalories}
            />
            <Separator />
            <WeeklyPfcChart
              entries={report.entries}
              averageProtein={report.averageProtein}
              averageFat={report.averageFat}
              averageCarbs={report.averageCarbs}
            />
            <Separator />
            <WeeklyCostChart
              entries={report.entries}
              averageCost={report.averageCost}
              totalCost={report.totalCost}
            />
          </div>
        )}
      </PageContainer>
    </>
  );
};

export { WeeklyReportView };
