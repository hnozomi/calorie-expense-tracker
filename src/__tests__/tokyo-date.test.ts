import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getMondayOf,
  getThisMondayInTokyo,
  getTodayInTokyo,
} from "@/utils/date";

afterEach(() => {
  vi.useRealTimers();
});

describe("getMondayOf", () => {
  it("AC-R-3: a Monday stays the same day", () => {
    expect(getMondayOf("2026-10-19")).toBe("2026-10-19");
  });

  it("AC-R-3: a Wednesday moves back to the Monday of its week", () => {
    expect(getMondayOf("2026-10-21")).toBe("2026-10-19");
  });

  it("AC-R-3: a Sunday belongs to the week that started six days earlier", () => {
    expect(getMondayOf("2026-10-25")).toBe("2026-10-19");
  });

  it("AC-R-3: a week that starts in the previous month", () => {
    expect(getMondayOf("2026-11-01")).toBe("2026-10-26");
  });

  it("AC-R-3: a week that starts in the previous year", () => {
    expect(getMondayOf("2027-01-03")).toBe("2026-12-28");
  });
});

describe("getTodayInTokyo", () => {
  it("AC-R-3: just before midnight in Tokyo is still the same day", () => {
    // 2026-10-25 23:59 in Asia/Tokyo (UTC+9)
    expect(getTodayInTokyo(new Date("2026-10-25T14:59:00Z"))).toBe(
      "2026-10-25",
    );
  });

  it("AC-R-3: midnight in Tokyo is already the next day while UTC is still the day before", () => {
    // 2026-10-26 00:00 in Asia/Tokyo
    expect(getTodayInTokyo(new Date("2026-10-25T15:00:00Z"))).toBe(
      "2026-10-26",
    );
  });

  it("AC-R-3: the new year starts in Tokyo before it starts in UTC", () => {
    expect(getTodayInTokyo(new Date("2026-12-31T15:00:00Z"))).toBe(
      "2027-01-01",
    );
  });

  it("AC-R-3: without an argument it uses the current time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-25T15:30:00Z"));
    expect(getTodayInTokyo()).toBe("2026-10-26");
  });
});

describe("getThisMondayInTokyo", () => {
  it("AC-R-3: Sunday night in Tokyo still belongs to the week that started on Monday", () => {
    // 2026-10-25 (Sun) 23:59 in Asia/Tokyo
    expect(getThisMondayInTokyo(new Date("2026-10-25T14:59:00Z"))).toBe(
      "2026-10-19",
    );
  });

  it("AC-R-3: Monday 00:00 in Tokyo starts a new week while UTC is still Sunday", () => {
    // 2026-10-26 (Mon) 00:00 in Asia/Tokyo
    expect(getThisMondayInTokyo(new Date("2026-10-25T15:00:00Z"))).toBe(
      "2026-10-26",
    );
  });

  it("AC-R-3: without an argument it uses the current time", () => {
    vi.useFakeTimers();
    // 2026-10-28 (Wed) 09:00 in Asia/Tokyo
    vi.setSystemTime(new Date("2026-10-28T00:00:00Z"));
    expect(getThisMondayInTokyo()).toBe("2026-10-26");
  });
});
