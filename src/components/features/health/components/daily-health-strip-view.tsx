import type { DailyHealth } from "@/components/features/health/types/daily-health";
import {
  formatBodyFat,
  formatSteps,
  formatWeight,
  formatWeightChange,
} from "@/components/features/health/utils/format-daily-health";
import { HealthStripItem } from "./health-strip-item";

type Props = {
  // null when the values could not be read
  health: DailyHealth | null;
};

const FAILED = "—";
const MISSING = "未取得";

/** One line under the summary: the day's weight (with its change), body fat and steps */
export const DailyHealthStripView = ({ health }: Props) => {
  const missing = health === null ? FAILED : MISSING;
  const weight =
    health?.weightKg != null
      ? `${formatWeight(health.weightKg)}${health.weightChange ? `（${formatWeightChange(health.weightChange)}）` : ""}`
      : null;
  const bodyFat =
    health?.bodyFatPct != null ? formatBodyFat(health.bodyFatPct) : null;
  const steps = health?.steps != null ? formatSteps(health.steps) : null;

  return (
    <section
      aria-label="健康データ"
      className="mx-4 flex h-10 flex-wrap content-center items-center gap-x-2 gap-y-0.5 rounded-lg bg-muted/50 px-3 text-xs leading-tight tabular-nums"
    >
      <HealthStripItem label="体重" value={weight} missing={missing} />
      <HealthStripItem
        label="体脂肪"
        value={bodyFat}
        missing={missing}
        hasSeparator
      />
      <HealthStripItem
        label="歩数"
        value={steps}
        missing={missing}
        hasSeparator
      />
    </section>
  );
};
