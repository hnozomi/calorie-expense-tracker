import { cn } from "@/utils";
import type { WeekDay } from "@/utils/date";

type Props = {
  days: WeekDay[];
  today: string;
};

export const PlanGridHeaderRow = ({ days, today }: Props) => (
  <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/60 bg-muted/30">
    <div className="sticky left-0 z-10 border-r border-border/40 bg-background p-2" />
    {days.map((day) => {
      const isToday = day.date === today;
      return (
        <div
          key={day.date}
          className={cn(
            "flex flex-col items-center gap-0.5 py-2",
            isToday && "bg-primary/5",
          )}
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {day.dayOfWeek}
          </p>
          <p
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
              isToday
                ? "bg-primary text-primary-foreground"
                : "text-foreground",
            )}
          >
            {day.label.split("/")[1]}
          </p>
        </div>
      );
    })}
  </div>
);
