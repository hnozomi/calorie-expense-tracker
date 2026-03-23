import { createStore } from "jotai";
import { describe, expect, it } from "vitest";
import { selectedDateAtom } from "@/components/features/meals/stores/date-atom";
import { formatDateToString, getTodayString } from "@/utils";

describe("formatDateToString", () => {
  it("formats a date as YYYY-MM-DD", () => {
    const date = new Date(2026, 2, 21); // March 21, 2026
    expect(formatDateToString(date)).toBe("2026-03-21");
  });

  it("pads single-digit month and day with zeros", () => {
    const date = new Date(2026, 0, 5); // January 5, 2026
    expect(formatDateToString(date)).toBe("2026-01-05");
  });

  it("handles December 31 correctly", () => {
    const date = new Date(2026, 11, 31);
    expect(formatDateToString(date)).toBe("2026-12-31");
  });
});

describe("getTodayString", () => {
  it("returns a string in YYYY-MM-DD format", () => {
    const today = getTodayString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("matches formatDateToString(new Date())", () => {
    expect(getTodayString()).toBe(formatDateToString(new Date()));
  });
});

describe("selectedDateAtom", () => {
  it("defaults to today when no value is set", () => {
    const store = createStore();
    expect(store.get(selectedDateAtom)).toBe(getTodayString());
  });

  it("returns the set value after being written", () => {
    const store = createStore();
    store.set(selectedDateAtom, "2026-03-15");
    expect(store.get(selectedDateAtom)).toBe("2026-03-15");
  });

  it("falls back to today when set to empty string", () => {
    const store = createStore();
    store.set(selectedDateAtom, "2026-03-15");
    store.set(selectedDateAtom, "");
    expect(store.get(selectedDateAtom)).toBe(getTodayString());
  });
});
