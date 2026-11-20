import type { ImportedHealthSource } from "@/components/features/health/types/health-import";
import { formatMonthDay } from "@/utils";

// Times are stored in UTC; the user reads them in Tokyo, wherever the server runs
const tokyoDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const tokyoParts = (iso: string) => {
  const parts = Object.fromEntries(
    tokyoDateTimeFormatter
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    time: `${parts.hour}:${parts.minute}`,
  };
};

export const HEALTH_SOURCE_LABELS: Record<
  ImportedHealthSource,
  { name: string; metrics: string }
> = {
  withings: { name: "Withings", metrics: "体重・体脂肪率" },
  apple_health: { name: "Apple Health", metrics: "歩数・活動量" },
};

/** 2026-11-18T22:05:00Z → 11/19 07:05 (Tokyo) */
export const formatImportedAt = (iso: string): string => {
  const { month, day, time } = tokyoParts(iso);
  return `${month}/${day} ${time}`;
};

/** 2026-11-19 → 11/19 */
export const formatLatestDate = (date: string): string => formatMonthDay(date);

/** 2026-11-19T22:05:00Z → 2026/11/20 (Tokyo). Tokens have no expiry, so the year is kept */
export const formatTokenDate = (iso: string): string => {
  const { year, month, day } = tokyoParts(iso);
  return `${year}/${month}/${day}`;
};

/** 2026-11-19T22:05:00Z → 2026/11/20 07:05 (Tokyo) */
export const formatTokenDateTime = (iso: string): string =>
  `${formatTokenDate(iso)} ${tokyoParts(iso).time}`;
