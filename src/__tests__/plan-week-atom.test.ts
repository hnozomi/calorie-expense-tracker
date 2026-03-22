import { createStore } from "jotai";
import { describe, expect, it } from "vitest";
import { planWeekStartAtom } from "@/components/features/plan/stores/plan-week-atom";
import { reportWeekStartAtom } from "@/components/features/report/stores/report-week-atom";
import { getThisMonday } from "@/utils";

describe("planWeekStartAtom", () => {
  it("defaults to this Monday when no value is set", () => {
    const store = createStore();
    expect(store.get(planWeekStartAtom)).toBe(getThisMonday());
  });

  it("returns the set value after being written", () => {
    const store = createStore();
    store.set(planWeekStartAtom, "2026-03-09");
    expect(store.get(planWeekStartAtom)).toBe("2026-03-09");
  });

  it("falls back to this Monday when set to empty string", () => {
    const store = createStore();
    store.set(planWeekStartAtom, "2026-03-09");
    store.set(planWeekStartAtom, "");
    expect(store.get(planWeekStartAtom)).toBe(getThisMonday());
  });

  it("can be updated multiple times", () => {
    const store = createStore();
    store.set(planWeekStartAtom, "2026-03-02");
    expect(store.get(planWeekStartAtom)).toBe("2026-03-02");
    store.set(planWeekStartAtom, "2026-03-09");
    expect(store.get(planWeekStartAtom)).toBe("2026-03-09");
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

  it("is independent of planWeekStartAtom", () => {
    const store = createStore();
    store.set(planWeekStartAtom, "2026-03-02");
    store.set(reportWeekStartAtom, "2026-03-09");
    expect(store.get(planWeekStartAtom)).toBe("2026-03-02");
    expect(store.get(reportWeekStartAtom)).toBe("2026-03-09");
  });
});
