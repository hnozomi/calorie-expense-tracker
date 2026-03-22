import { cn } from "@/utils";

type PfcDisplayProps = {
  protein: number;
  fat: number;
  carbs: number;
  className?: string;
  size?: "sm" | "md";
  precision?: number;
};

/** Colored indicator dot for PFC labels */
const PfcDot = ({ color }: { color: string }) => (
  <span className={cn("inline-block h-2 w-2 rounded-full", color)} />
);

/** Color-coded PFC (Protein/Fat/Carbs) display */
/** Color-coded PFC (Protein/Fat/Carbs) display */
const PfcDisplay = ({
  protein,
  fat,
  carbs,
  className,
  size = "sm",
  precision = 1,
}: PfcDisplayProps) => {
  const isSmall = size === "sm";
  /** Format a numeric value to the specified decimal precision */
  const fmt = (v: number) => v.toFixed(precision);
  return (
    <div
      className={cn("flex gap-3", isSmall ? "text-xs" : "text-sm", className)}
    >
      <span className="flex items-center gap-1">
        <PfcDot color="bg-blue-500" />
        <span className="text-blue-600 dark:text-blue-400">
          P {fmt(protein)}
        </span>
      </span>
      <span className="flex items-center gap-1">
        <PfcDot color="bg-amber-500" />
        <span className="text-amber-600 dark:text-amber-400">F {fmt(fat)}</span>
      </span>
      <span className="flex items-center gap-1">
        <PfcDot color="bg-green-500" />
        <span className="text-green-600 dark:text-green-400">
          C {fmt(carbs)}
        </span>
      </span>
    </div>
  );
};

export { PfcDisplay, PfcDot };
