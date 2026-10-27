import type {
  DailyTotals,
  DayCalorieRating,
} from "@/components/features/plan/utils/plan-index";
import { PlanGridDayTotal } from "./plan-grid-day-total";

type Props = {
  dayTotals: {
    date: string;
    totals: DailyTotals;
    isToday: boolean;
    rating: DayCalorieRating;
  }[];
};

export const PlanGridTotalsRow = ({ dayTotals }: Props) => (
  <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/60 bg-muted/20">
    <div className="sticky left-0 z-10 flex items-center justify-center border-r border-border/40 bg-background p-1">
      <span className="text-[10px] font-semibold tracking-wider text-muted-foreground">
        合計
      </span>
    </div>
    {dayTotals.map(({ date, totals, isToday, rating }) => (
      <PlanGridDayTotal
        key={date}
        totals={totals}
        isToday={isToday}
        rating={rating}
      />
    ))}
  </div>
);
