"use client";

import { useAtom } from "jotai";
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Wallet,
} from "lucide-react";
import { Header, PageContainer } from "@/components/features/layout";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { shiftDate } from "@/utils";
import { useWeeklyReport } from "../hooks/use-weekly-report";
import { reportWeekStartAtom } from "../stores/report-week-atom";
import { WeeklyCalorieChart } from "./weekly-calorie-chart";
import { WeeklyCostChart } from "./weekly-cost-chart";
import { WeeklyPfcChart } from "./weekly-pfc-chart";

/** Main view for the weekly report */
const WeeklyReportView = () => {
  const [weekStart, setWeekStart] = useAtom(reportWeekStartAtom);
  const { data: report } = useWeeklyReport(weekStart);

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
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="前の週"
            className="rounded-full"
            onClick={() => setWeekStart(shiftDate(weekStart, -7))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="inline-flex min-w-[140px] items-center justify-center rounded-full bg-muted/60 px-4 py-1.5 text-sm font-semibold tracking-wide">
            {weekLabel}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="次の週"
            className="rounded-full"
            onClick={() => setWeekStart(shiftDate(weekStart, 7))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4 px-4 pb-6">
          {/* Calorie section */}
          <section className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <SectionHeader icon={Flame} label="カロリー">
              <span className="text-xs font-medium text-muted-foreground">
                平均 {Math.round(report.averageCalories)} kcal/日
              </span>
            </SectionHeader>
            <div className="mt-3">
              <WeeklyCalorieChart
                entries={report.entries}
                averageCalories={report.averageCalories}
              />
            </div>
          </section>

          {/* PFC section */}
          <section className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <SectionHeader icon={Dumbbell} label="PFCバランス" />
            <div className="mt-3">
              <WeeklyPfcChart
                entries={report.entries}
                averageProtein={report.averageProtein}
                averageFat={report.averageFat}
                averageCarbs={report.averageCarbs}
              />
            </div>
          </section>

          {/* Cost section */}
          <section className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <SectionHeader icon={Wallet} label="食費">
              <span className="text-xs font-medium text-muted-foreground">
                合計 ¥{Math.round(report.totalCost).toLocaleString()}
              </span>
            </SectionHeader>
            <div className="mt-3">
              <WeeklyCostChart
                entries={report.entries}
                averageCost={report.averageCost}
                totalCost={report.totalCost}
              />
            </div>
          </section>
        </div>
      </PageContainer>
    </>
  );
};

export { WeeklyReportView };
