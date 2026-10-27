import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils";
import { PfcDot } from "./pfc-display";

const TONES = {
  protein: {
    label: "P (g)",
    card: "border-blue-200/60 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20",
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-400",
    input:
      "border-blue-200/80 bg-white font-medium text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300",
  },
  fat: {
    label: "F (g)",
    card: "border-amber-200/60 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    input:
      "border-amber-200/80 bg-white font-medium text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300",
  },
  carbs: {
    label: "C (g)",
    card: "border-green-200/60 bg-green-50/50 dark:border-green-900/40 dark:bg-green-950/20",
    dot: "bg-green-500",
    text: "text-green-700 dark:text-green-400",
    input:
      "border-green-200/80 bg-white font-medium text-green-700 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-300",
  },
} as const;

type Props = ComponentProps<"input"> & {
  id: string;
  nutrient: keyof typeof TONES;
  error?: string;
};

/** A color-coded P / F / C input card; the input props (e.g. react-hook-form's register) pass through */
export const PfcInputCard = ({ id, nutrient, error, ...inputProps }: Props) => {
  const tone = TONES[nutrient];
  return (
    <div className={cn("space-y-1.5 rounded-lg border p-2.5", tone.card)}>
      <Label htmlFor={id} className="flex items-center gap-1.5 text-xs">
        <PfcDot color={tone.dot} />
        <span className={tone.text}>{tone.label}</span>
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step="any"
        className={tone.input}
        placeholder="0"
        {...inputProps}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};
