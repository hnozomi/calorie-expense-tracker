import "server-only";
import { cacheLife } from "next/cache";
import type { DailyHealth } from "@/components/features/health/types/daily-health";
import {
  type HealthImportSourceStatus,
  IMPORTED_HEALTH_SOURCES,
  type ImportedHealthSource,
  type ImportTokenSummary,
} from "@/components/features/health/types/health-import";
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

/** When the source last sent values (imported_at of its newest import), or null when it never sent any */
const readLastImportedAt = async (
  source: ImportedHealthSource,
): Promise<string | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("health_daily_values")
    .select("imported_at")
    .eq("source", source)
    .order("imported_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.imported_at ?? null;
};

// A refill of earlier days is imported after newer days, so the newest import is not always the latest day
/** The latest day the source sent values for, or null when it never sent any */
const readLatestDate = async (
  source: ImportedHealthSource,
): Promise<string | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("health_daily_values")
    .select("date")
    .eq("source", source)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.date ?? null;
};

/** For each imported source, when it last sent values (imported_at) and the latest day it sent (date) */
export const getHealthImportStatus = async (): Promise<
  HealthImportSourceStatus[]
> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  return Promise.all(
    IMPORTED_HEALTH_SOURCES.map(async (source) => {
      const [lastImportedAt, latestDate] = await Promise.all([
        readLastImportedAt(source),
        readLatestDate(source),
      ]);
      return { source, lastImportedAt, latestDate };
    }),
  );
};

/** The signed-in user's import tokens, newest first. token_hash is not selected (nor can authenticated read it) */
export const getImportTokens = async (): Promise<ImportTokenSummary[]> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("import_tokens")
    .select("id, label, token_prefix, created_at, last_used_at, revoked_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    tokenPrefix: row.token_prefix,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
  }));
};
