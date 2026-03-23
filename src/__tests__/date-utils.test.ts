import { describe, expect, it } from "vitest";
import {
  buildWeekDays,
  formatDateToString,
  formatDisplayDate,
  formatWeekLabel,
  getThisMonday,
  getTodayString,
  shiftDate,
} from "@/utils";

describe("formatDateToString", () => {
  it("formats a date as YYYY-MM-DD", () => {
    const date = new Date(2026, 2, 22); // March 22, 2026
    expect(formatDateToString(date)).toBe("2026-03-22");
  });

  it("pads single-digit month and day with zeros", () => {
    const date = new Date(2026, 0, 5); // January 5, 2026
    expect(formatDateToString(date)).toBe("2026-01-05");
  });

  it("handles December 31 correctly", () => {
    const date = new Date(2026, 11, 31);
    expect(formatDateToString(date)).toBe("2026-12-31");
  });

  it("handles January 1 correctly", () => {
    const date = new Date(2026, 0, 1);
    expect(formatDateToString(date)).toBe("2026-01-01");
  });
});

describe("shiftDate", () => {
  it("shifts forward by 1 day", () => {
    expect(shiftDate("2026-03-22", 1)).toBe("2026-03-23");
  });

  it("shifts backward by 1 day", () => {
    expect(shiftDate("2026-03-22", -1)).toBe("2026-03-21");
  });

  it("shifts forward by 7 days (one week)", () => {
    expect(shiftDate("2026-03-16", 7)).toBe("2026-03-23");
  });

  it("shifts backward by 7 days (one week)", () => {
    expect(shiftDate("2026-03-23", -7)).toBe("2026-03-16");
  });

  it("handles month boundary (forward)", () => {
    expect(shiftDate("2026-03-31", 1)).toBe("2026-04-01");
  });

  it("handles month boundary (backward)", () => {
    expect(shiftDate("2026-04-01", -1)).toBe("2026-03-31");
  });

  it("handles year boundary (forward)", () => {
    expect(shiftDate("2025-12-31", 1)).toBe("2026-01-01");
  });

  it("handles year boundary (backward)", () => {
    expect(shiftDate("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("handles leap year (Feb 28 → Feb 29)", () => {
    expect(shiftDate("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("handles non-leap year (Feb 28 → Mar 1)", () => {
    expect(shiftDate("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("shifts by 0 days returns same date", () => {
    expect(shiftDate("2026-03-22", 0)).toBe("2026-03-22");
  });

  it("shifts by 6 days for week end calculation", () => {
    expect(shiftDate("2026-03-16", 6)).toBe("2026-03-22");
  });
});

describe("getThisMonday", () => {
  it("returns a string in YYYY-MM-DD format", () => {
    const monday = getThisMonday();
    expect(monday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns a Monday (day of week = 1)", () => {
    const monday = getThisMonday();
    const date = new Date(`${monday}T00:00:00`);
    expect(date.getDay()).toBe(1);
  });

  it("returns a date within 6 days before today", () => {
    const monday = getThisMonday();
    const mondayDate = new Date(`${monday}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays =
      (today.getTime() - mondayDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(0);
    expect(diffDays).toBeLessThan(7);
  });
});

describe("getTodayString", () => {
  it("returns today's date in YYYY-MM-DD format", () => {
    expect(getTodayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("formatDisplayDate", () => {
  it("formats a YYYY-MM-DD string for Japanese display", () => {
    expect(formatDisplayDate("2026-03-15")).toBe("3/15（日）");
  });
});

describe("formatWeekLabel", () => {
  it("formats a week range label", () => {
    expect(formatWeekLabel("2026-03-16")).toBe("3/16 - 3/22");
  });
});

describe("buildWeekDays", () => {
  it("builds 7 days from the given week start", () => {
    const days = buildWeekDays("2026-03-16");
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({
      date: "2026-03-16",
      label: "3/16",
      dayOfWeek: "月",
    });
    expect(days[6]).toEqual({
      date: "2026-03-22",
      label: "3/22",
      dayOfWeek: "日",
    });
  });
});
