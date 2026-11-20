import {
  type DailyHealth,
  HEALTH_METRICS,
  HEALTH_SOURCES,
  type HealthMetric,
  type HealthSource,
  type HealthValueRow,
  type WeightChange,
} from "@/components/features/health/types/daily-health";
import { shiftDate } from "@/utils";

// The source shown when a day has the same metric from several (phase 1 design 1-1). The DB keeps every row
const SOURCE_PRIORITY: Record<HealthMetric, readonly HealthSource[]> = {
  weight_kg: ["withings", "apple_health", "manual"],
  body_fat_pct: ["withings", "apple_health", "manual"],
  steps: ["apple_health", "withings", "manual"],
  active_energy_kcal: ["apple_health", "withings", "manual"],
};

/** How many days back the weight change may look for an earlier weight */
export const WEIGHT_CHANGE_LOOKBACK_DAYS = 7;

const isHealthMetric = (value: string): value is HealthMetric =>
  (HEALTH_METRICS as readonly string[]).includes(value);

const isHealthSource = (value: string): value is HealthSource =>
  (HEALTH_SOURCES as readonly string[]).includes(value);

/** Narrow the DB's text columns to the known metrics and sources (the CHECK constraints allow nothing else) */
export const toHealthValueRows = (
  rows: { date: string; metric: string; source: string; value: number }[],
): HealthValueRow[] =>
  rows.flatMap(({ date, metric, source, value }) =>
    isHealthMetric(metric) && isHealthSource(source)
      ? [{ date, metric, source, value: Number(value) }]
      : [],
  );

/** The value of one metric on one day from the highest-priority source that has it, or null when none does */
export const pickHealthValue = (
  rows: HealthValueRow[],
  date: string,
  metric: HealthMetric,
): number | null => {
  for (const source of SOURCE_PRIORITY[metric]) {
    const row = rows.find(
      (candidate) =>
        candidate.date === date &&
        candidate.metric === metric &&
        candidate.source === source,
    );
    if (row) return row.value;
  }
  return null;
};

/**
 * The day's weight against the day before. When the day before has none, against the closest earlier day within
 * 7 days (shown as 前回比). null when the day has no weight or no earlier weight is that close
 */
export const findWeightChange = (
  rows: HealthValueRow[],
  date: string,
): WeightChange | null => {
  const current = pickHealthValue(rows, date, "weight_kg");
  if (current === null) return null;
  for (let daysBack = 1; daysBack <= WEIGHT_CHANGE_LOOKBACK_DAYS; daysBack++) {
    const comparedDate = shiftDate(date, -daysBack);
    const earlier = pickHealthValue(rows, comparedDate, "weight_kg");
    if (earlier !== null) {
      // Weights carry two decimals; rounding drops the float noise of the subtraction (82.4 - 82.7)
      const diffKg = Math.round((current - earlier) * 100) / 100;
      return { diffKg, comparedDate, isPreviousDay: daysBack === 1 };
    }
  }
  return null;
};

/** The values the home band shows for a day, from the rows of that day and the 7 days before it */
export const buildDailyHealth = (
  rows: HealthValueRow[],
  date: string,
): DailyHealth => ({
  weightKg: pickHealthValue(rows, date, "weight_kg"),
  weightChange: findWeightChange(rows, date),
  bodyFatPct: pickHealthValue(rows, date, "body_fat_pct"),
  steps: pickHealthValue(rows, date, "steps"),
  activeEnergyKcal: pickHealthValue(rows, date, "active_energy_kcal"),
});
