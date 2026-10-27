import { PfcDisplay } from "@/components/ui/pfc-display";
import { cn } from "@/utils";
import type { DailyTotals } from "../utils/plan-index";

type Props = {
  totals: DailyTotals;
  isToday: boolean;
  targetCalories: number;
  /** The largest day of the week, so the bar shows each day relative to it */
  maxCalories: number;
};

export const PlanGridDayTotal = ({
  totals,
  isToday,
  targetCalories,
  maxCalories,
}: Props) => {
  const cal = totals.calories;
  const hasTarget = targetCalories > 0;
  const isOver = hasTarget && cal > targetCalories;
  const isLow = hasTarget && cal > 0 && cal < targetCalories * 0.8;
  const intensity = maxCalories > 0 ? cal / maxCalories : 0;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 border-r border-border/30 py-2 last:border-r-0",
        isToday && "bg-primary/5",
      )}
    >
      {cal > 0 ? (
        <>
          <span
            className={cn(
              "text-xs font-bold tabular-nums",
              isOver
                ? "text-destructive"
                : isLow
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-foreground",
            )}
          >
            {Math.round(cal)}
          </span>
          <span className="text-[9px] text-muted-foreground">kcal</span>
          {/* Mini bar showing relative amount */}
          <div className="mt-0.5 h-1 w-10 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isOver ? "bg-destructive" : isLow ? "bg-amber-400" : "bg-brand",
              )}
              style={{
                width: `${Math.min(intensity * 100, 100)}%`,
              }}
            />
          </div>
          <PfcDisplay
            protein={totals.protein}
            fat={totals.fat}
            carbs={totals.carbs}
            className="mt-1 flex-col gap-0 text-[9px]"
            precision={0}
          />
          {totals.cost > 0 && (
            <span className="mt-0.5 text-[9px] font-medium tabular-nums text-muted-foreground">
              ¥{Math.round(totals.cost).toLocaleString()}
            </span>
          )}
        </>
      ) : (
        <span className="text-[10px] text-muted-foreground/40">—</span>
      )}
    </div>
  );
};
