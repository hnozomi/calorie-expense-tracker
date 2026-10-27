import "server-only";
import { cacheLife } from "next/cache";
import type { WeeklyReport } from "@/components/features/report/types/weekly-report";
import {
  buildWeeklyReport,
  type WeeklySummaryRow,
} from "@/components/features/report/utils/build-weekly-report";
import { SCREEN_CACHE } from "@/lib/screen-cache";
import { createClient } from "@/lib/supabase/server";

export const getWeeklyReport = async (
  weekStart: string,
): Promise<WeeklyReport> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_weekly_summary", {
    p_start_date: weekStart,
  });
  if (error) throw error;
  // The Supabase client has no generated types; the row shape follows the RPC in supabase/migrations
  return buildWeeklyReport(weekStart, (data ?? []) as WeeklySummaryRow[]);
};
