import { cn } from "@/utils";

/** Single PFC progress bar row */
type Props = {
  label: string;
  current: number;
  target: number;
  color: string;
  bgColor: string;
  textColor: string;
};

export const PfcBar = ({
  label,
  current,
  target,
  color,
  bgColor,
  textColor,
}: Props) => {
  const ratio = target > 0 ? Math.min(current / target, 1) : 0;
  const remaining = Math.max(target - current, 0);
  const isOver = current > target && target > 0;

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className={cn("font-semibold", textColor)}>{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {current.toFixed(1)}
          {target > 0 && (
            <>
              <span className="text-muted-foreground/60"> / {target}g</span>
              <span
                className={cn(
                  "ml-1 font-medium",
                  isOver ? "text-destructive" : textColor,
                )}
              >
                {isOver
                  ? `+${(current - target).toFixed(1)}`
                  : `あと${remaining.toFixed(1)}`}
              </span>
            </>
          )}
        </span>
      </div>
      {target > 0 && (
        <div className={cn("h-1.5 overflow-hidden rounded-full", bgColor)}>
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isOver ? "bg-destructive" : color,
            )}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};
