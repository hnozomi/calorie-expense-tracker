import type { WeightChange } from "@/components/features/health/types/daily-health";
import { formatMonthDay } from "@/utils";

const integerFormatter = new Intl.NumberFormat("ja-JP", {
  maximumFractionDigits: 0,
});

/** 82.4 → 82.4kg (the decimals the source sent, up to two) */
export const formatWeight = (weightKg: number): string => `${weightKg}kg`;

/** 21.3 → 21.3% */
export const formatBodyFat = (bodyFatPct: number): string => `${bodyFatPct}%`;

/** 8214 → 8,214. Zero steps is a value and shows as 0 */
export const formatSteps = (steps: number): string =>
  integerFormatter.format(steps);

// The minus is U+2212 as in the design's example (−0.3), so it lines up with the plus sign
const formatSignedKg = (diffKg: number): string => {
  if (diffKg === 0) return "±0";
  return diffKg > 0 ? `+${diffKg}` : `−${Math.abs(diffKg)}`;
};

/** 前日比 −0.3 against the day before, 前回比（11/17） −0.3 against an earlier day */
export const formatWeightChange = (change: WeightChange): string => {
  const label = change.isPreviousDay
    ? "前日比"
    : `前回比（${formatMonthDay(change.comparedDate)}）`;
  return `${label} ${formatSignedKg(change.diffKg)}`;
};
