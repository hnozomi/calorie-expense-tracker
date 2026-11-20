export const HEALTH_METRICS = [
  "weight_kg",
  "body_fat_pct",
  "steps",
  "active_energy_kcal",
] as const;
export type HealthMetric = (typeof HEALTH_METRICS)[number];

export const HEALTH_SOURCES = ["withings", "apple_health", "manual"] as const;
export type HealthSource = (typeof HEALTH_SOURCES)[number];

export type HealthValueRow = {
  date: string;
  metric: HealthMetric;
  source: HealthSource;
  value: number;
};

export type WeightChange = {
  diffKg: number;
  comparedDate: string;
  isPreviousDay: boolean;
};

/** The values of one day, each already chosen from its sources. null is a day without the value */
export type DailyHealth = {
  weightKg: number | null;
  weightChange: WeightChange | null;
  bodyFatPct: number | null;
  steps: number | null;
  activeEnergyKcal: number | null;
};
