import { createStore } from "jotai";
import { describe, expect, it } from "vitest";
import {
  formatDate,
  getToday,
  selectedDateAtom,
} from "@/components/features/meals/stores/date-atom";

describe("formatDate", () => {
  it("formats a date as YYYY-MM-DD", () => {
    const date = new Date(2026, 2, 21); // March 21, 2026
    expect(formatDate(date)).toBe("2026-03-21");
  });

  it("pads single-digit month and day with zeros", () => {
    const date = new Date(2026, 0, 5); // January 5, 2026
    expect(formatDate(date)).toBe("2026-01-05");
  });

  it("handles December 31 correctly", () => {
    const date = new Date(2026, 11, 31);
    expect(formatDate(date)).toBe("2026-12-31");
  });
});

describe("getToday", () => {
  it("returns a string in YYYY-MM-DD format", () => {
    const today = getToday();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("matches formatDate(new Date())", () => {
    expect(getToday()).toBe(formatDate(new Date()));
  });
});

describe("selectedDateAtom", () => {
  it("defaults to today when no value is set", () => {
    const store = createStore();
    expect(store.get(selectedDateAtom)).toBe(getToday());
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
    expect(store.get(selectedDateAtom)).toBe(getToday());
  });
});
