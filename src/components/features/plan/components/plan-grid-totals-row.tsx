import type { WeekDay } from "@/utils/date";
import { type DailyTotals, EMPTY_TOTALS } from "../utils/plan-index";
import { PlanGridDayTotal } from "./plan-grid-day-total";

type Props = {
  days: WeekDay[];
  today: string;
  totalsByDate: Map<string, DailyTotals>;
  targetCalories: number;
  maxCalories: number;
};

export const PlanGridTotalsRow = ({
  days,
  today,
  totalsByDate,
  targetCalories,
  maxCalories,
}: Props) => (
  <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/60 bg-muted/20">
    <div className="sticky left-0 z-10 flex items-center justify-center border-r border-border/40 bg-background p-1">
      <span className="text-[10px] font-semibold tracking-wider text-muted-foreground">
        合計
      </span>
    </div>
    {days.map((day) => (
      <PlanGridDayTotal
        key={day.date}
        totals={totalsByDate.get(day.date) ?? EMPTY_TOTALS}
        isToday={day.date === today}
        targetCalories={targetCalories}
        maxCalories={maxCalories}
      />
    ))}
  </div>
);
