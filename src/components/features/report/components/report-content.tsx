import { Dumbbell, Flame, Wallet } from "lucide-react";
import { getWeeklyReport } from "@/components/features/report/api/queries";
import { hasReportData } from "@/components/features/report/utils/build-weekly-report";
import { reportHref } from "@/components/features/report/utils/report-href";
import { SectionHeader } from "@/components/ui/section-header";
import { WeekSwitcher } from "@/components/ui/week-switcher";
import { formatWeekLabel, shiftDate } from "@/utils";
import { WeeklyCalorieChart } from "./weekly-calorie-chart";
import { WeeklyCostChart } from "./weekly-cost-chart";
import { WeeklyPfcChart } from "./weekly-pfc-chart";

type Props = {
  weekStart: string;
  thisMonday: string;
};

export const ReportContent = async ({ weekStart, thisMonday }: Props) => {
  const report = await getWeeklyReport(weekStart);

  return (
    <>
      <WeekSwitcher
        label={formatWeekLabel(weekStart)}
        isCurrentWeek={weekStart === thisMonday}
        previousHref={reportHref(shiftDate(weekStart, -7), thisMonday)}
        nextHref={reportHref(shiftDate(weekStart, 7), thisMonday)}
        currentWeekHref={reportHref(thisMonday, thisMonday)}
      />

      {hasReportData(report) ? (
        <div className="space-y-4 px-4 pb-6">
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
      ) : (
        <div className="mx-4 mb-4 rounded-xl border border-dashed border-muted-foreground/25 py-10 text-center">
          <p className="text-sm font-medium">この週の記録はありません</p>
          <p className="mt-1 text-xs text-muted-foreground">
            ホーム画面から食事を登録するとレポートが表示されます
          </p>
        </div>
      )}
    </>
  );
};
