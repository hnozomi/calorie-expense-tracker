import "server-only";
import { cacheLife } from "next/cache";
import type { DailyHealth } from "@/components/features/health/types/daily-health";
import {
  buildDailyHealth,
  toHealthValueRows,
  WEIGHT_CHANGE_LOOKBACK_DAYS,
} from "@/components/features/health/utils/daily-health";
import { SCREEN_CACHE } from "@/lib/screen-cache";
import { createClient } from "@/lib/supabase/server";
import { shiftDate } from "@/utils";

/** The health values of a day, with the 7 days before it read in the same query for the weight change */
const getDailyHealth = async (date: string): Promise<DailyHealth> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("health_daily_values")
    .select("date, metric, source, value")
    .gte("date", shiftDate(date, -WEIGHT_CHANGE_LOOKBACK_DAYS))
    .lte("date", date);
  if (error) throw error;

  return buildDailyHealth(toHealthValueRows(data ?? []), date);
};

// A failed read resolves to null instead of rejecting: the band shows — and the rest of the home screen stays
// (a rejection would reach the route's error page)
/** getDailyHealth that never rejects; null means the values could not be read */
export const readDailyHealth = async (
  date: string,
): Promise<DailyHealth | null> => {
  try {
    return await getDailyHealth(date);
  } catch {
    return null;
  }
};
