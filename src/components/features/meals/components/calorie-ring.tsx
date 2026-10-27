import { Flame } from "lucide-react";
import { cn } from "@/utils";

/** Circular progress ring for calorie target */
type Props = {
  current: number;
  target: number;
};

export const CalorieRing = ({ current, target }: Props) => {
  const ratio = target > 0 ? Math.min(current / target, 1.2) : 0;
  const isOver = current > target && target > 0;
  const circumference = 2 * Math.PI * 38;
  const dashOffset = circumference * (1 - Math.min(ratio, 1));

  return (
    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
      <svg
        className="h-20 w-20 -rotate-90"
        viewBox="0 0 80 80"
        role="img"
        aria-label="カロリー進捗"
      >
        <circle
          cx="40"
          cy="40"
          r="38"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-brand-border/60"
        />
        <circle
          cx="40"
          cy="40"
          r="38"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={cn(
            "transition-all duration-500",
            isOver ? "text-destructive" : "text-brand",
          )}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <Flame
          className={cn(
            "h-3.5 w-3.5",
            isOver ? "text-destructive" : "text-brand",
          )}
        />
        <p className="text-lg font-extrabold leading-tight tracking-tight">
          {Math.round(current)}
        </p>
        <p className="text-[9px] font-medium text-muted-foreground">kcal</p>
      </div>
    </div>
  );
};
