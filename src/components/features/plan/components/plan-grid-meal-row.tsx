import type { DisplayedMealPlan } from "@/components/features/plan/types/meal-plan";
import { MEAL_TYPE_LABELS, type MealType } from "@/types";
import { cn } from "@/utils";
import type { WeekDay } from "@/utils/date";
import { PlanCell } from "./plan-cell";

type Props = {
  mealType: MealType;
  days: WeekDay[];
  today: string;
  plansBySlot: Map<string, DisplayedMealPlan[]>;
};

export const PlanGridMealRow = ({
  mealType,
  days,
  today,
  plansBySlot,
}: Props) => (
  <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/40">
    {/* Sticky label so meal rows stay identifiable while scrolling horizontally */}
    <div className="sticky left-0 z-10 flex items-center justify-center border-r border-border/40 bg-background p-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {MEAL_TYPE_LABELS[mealType]}
      </span>
    </div>
    {days.map((day) => {
      const isToday = day.date === today;
      return (
        <div
          key={`${day.date}-${mealType}`}
          className={cn(
            "min-w-0 overflow-hidden border-r border-border/30 last:border-r-0",
            isToday && "bg-primary/5",
          )}
        >
          <PlanCell
            date={day.date}
            mealType={mealType}
            plans={plansBySlot.get(`${day.date}:${mealType}`) ?? []}
          />
        </div>
      );
    })}
  </div>
);
