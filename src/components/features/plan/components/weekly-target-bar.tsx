import { cn } from "@/utils";

type Props = {
  weeklyTarget: number;
  dailyTarget: number;
  plannedDayCount: number;
  calorieDiff: number;
  plannedCalories: number;
};

export const WeeklyTargetBar = ({
  weeklyTarget,
  dailyTarget,
  plannedDayCount,
  calorieDiff,
  plannedCalories,
}: Props) => (
  <div className="rounded-lg bg-muted/40 px-3 py-2">
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">
        目標: {weeklyTarget.toLocaleString()} kcal
        <span className="ml-1 text-[10px]">
          ({dailyTarget.toLocaleString()} × 計画済み{plannedDayCount}日分)
        </span>
      </span>
      <span
        className={cn(
          "font-bold tabular-nums",
          calorieDiff > 0
            ? "text-destructive"
            : calorieDiff < 0
              ? "text-blue-600 dark:text-blue-400"
              : "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {calorieDiff > 0 ? "+" : ""}
        {calorieDiff.toLocaleString()} kcal
      </span>
    </div>
    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          calorieDiff > 0 ? "bg-destructive" : "bg-brand",
        )}
        style={{
          width: `${Math.min((plannedCalories / weeklyTarget) * 100, 100)}%`,
        }}
      />
    </div>
    {plannedDayCount < 7 && (
      <p className="mt-1 text-[10px] text-muted-foreground">
        7日中{plannedDayCount}日計画済み
      </p>
    )}
  </div>
);
