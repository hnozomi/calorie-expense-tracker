import type { DailyHealth } from "@/components/features/health/types/daily-health";
import { DailyHealthStripView } from "./daily-health-strip-view";

type Props = {
  // Started by the caller with readDailyHealth alongside the day's meals, so the band does not wait for them
  health: Promise<DailyHealth | null>;
};

/** Waits for the day's health values inside its own Suspense, so the summary and slots never wait for it */
export const DailyHealthStrip = async ({ health }: Props) => (
  <DailyHealthStripView health={await health} />
);
