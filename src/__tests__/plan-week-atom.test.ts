import { createStore } from "jotai";
import { describe, expect, it } from "vitest";
import { planHref } from "@/components/features/plan/utils/plan-href";
import { reportWeekStartAtom } from "@/components/features/report/stores/report-week-atom";
import { getThisMonday } from "@/utils";

// Phase 3 moved the plan's week from planWeekStartAtom into the URL (ui-tech §1, AC-R-3).
// The same behaviour the atom gave (this week by default, any other week kept) is checked on the URL it builds now
describe("planHref (the plan's week lives in ?week=)", () => {
  const THIS_MONDAY = "2026-10-19";

  it("AC-R-3: this week is the plain /plan, which opens on this week (ui-tech §1)", () => {
    expect(planHref(THIS_MONDAY, THIS_MONDAY)).toBe("/plan");
  });

  it("AC-R-3: the previous week is in the URL as ?week= of its Monday", () => {
    expect(planHref("2026-10-12", THIS_MONDAY)).toBe("/plan?week=2026-10-12");
  });

  it("AC-R-3: the next week is in the URL as ?week= of its Monday", () => {
    expect(planHref("2026-10-26", THIS_MONDAY)).toBe("/plan?week=2026-10-26");
  });

  it("AC-R-3: a week across the year boundary keeps its own year", () => {
    expect(planHref("2026-12-28", "2027-01-04")).toBe("/plan?week=2026-12-28");
  });
});

describe("reportWeekStartAtom", () => {
  it("defaults to this Monday when no value is set", () => {
    const store = createStore();
    expect(store.get(reportWeekStartAtom)).toBe(getThisMonday());
  });

  it("returns the set value after being written", () => {
    const store = createStore();
    store.set(reportWeekStartAtom, "2026-03-09");
    expect(store.get(reportWeekStartAtom)).toBe("2026-03-09");
  });

  it("falls back to this Monday when set to empty string", () => {
    const store = createStore();
    store.set(reportWeekStartAtom, "2026-03-09");
    store.set(reportWeekStartAtom, "");
    expect(store.get(reportWeekStartAtom)).toBe(getThisMonday());
  });

  it("is independent of the plan's week", () => {
    const store = createStore();
    store.set(reportWeekStartAtom, "2026-03-09");
    expect(planHref("2026-03-02", getThisMonday())).toBe(
      "/plan?week=2026-03-02",
    );
    expect(store.get(reportWeekStartAtom)).toBe("2026-03-09");
  });
});
