"use client";

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
import { useWeekStartNavigation } from "@/hooks";
import { formatWeekLabel, getThisMonday } from "@/utils";
import { useWeeklyReport } from "../hooks/use-weekly-report";
import { reportWeekStartAtom } from "../stores/report-week-atom";
import { WeeklyCalorieChart } from "./weekly-calorie-chart";
import { WeeklyCostChart } from "./weekly-cost-chart";
import { WeeklyPfcChart } from "./weekly-pfc-chart";

/** Main view for the weekly report */
const WeeklyReportView = () => {
  const {
    value: weekStart,
    isDefaultValue: isCurrentWeek,
    setDate: setWeekStart,
    shiftBackward,
    shiftForward,
  } = useWeekStartNavigation(reportWeekStartAtom, getThisMonday());
  const { data: report } = useWeeklyReport(weekStart);
  const weekLabel = formatWeekLabel(weekStart);
  const hasWeekData = report.entries.some(
    (entry) =>
      entry.calories > 0 ||
      entry.totalCost > 0 ||
      entry.protein + entry.fat + entry.carbs > 0,
  );

  return (
    <>
      <Header title="ウィークリーレポート" />
      <PageContainer>
        {/* Week navigation */}
        <div className="relative flex items-center justify-center gap-2 py-4">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="前の週"
            className="rounded-full"
            onClick={shiftBackward}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="inline-flex min-w-[140px] items-center justify-center rounded-full bg-muted/60 px-4 py-1.5 text-sm font-semibold tracking-wide">
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
            className="rounded-full"
            onClick={shiftForward}
          >
            <ChevronRight className="h-5 w-5" />
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

        {!hasWeekData && (
          <div className="mx-4 mb-4 rounded-xl border border-dashed border-muted-foreground/25 py-10 text-center">
            <p className="text-sm font-medium">この週の記録はありません</p>
            <p className="mt-1 text-xs text-muted-foreground">
              ホーム画面から食事を登録するとレポートが表示されます
            </p>
          </div>
        )}

        {hasWeekData && (
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
        )}
      </PageContainer>
    </>
  );
};

export { WeeklyReportView };
