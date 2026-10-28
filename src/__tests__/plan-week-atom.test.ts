import { describe, expect, it } from "vitest";
import { planHref } from "@/components/features/plan/utils/plan-href";
import { reportHref } from "@/components/features/report/utils/report-href";

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

// Phase 5 moved the report's week from reportWeekStartAtom into the URL too (ui-tech §1, AC-R-3).
// The same behaviour the atom gave (this week by default, any other week kept, nothing carried over) is checked on the URL
describe("reportHref (the report's week lives in ?week=)", () => {
  const THIS_MONDAY = "2026-10-19";

  it("AC-R-3: this week is the plain /other/report, which opens on this week (ui-tech §1)", () => {
    expect(reportHref(THIS_MONDAY, THIS_MONDAY)).toBe("/other/report");
  });

  it("AC-R-3: another week is kept in the URL as ?week= of its Monday", () => {
    expect(reportHref("2026-03-09", THIS_MONDAY)).toBe(
      "/other/report?week=2026-03-09",
    );
  });

  it("AC-R-3: the next week is in the URL as ?week= of its Monday", () => {
    expect(reportHref("2026-10-26", THIS_MONDAY)).toBe(
      "/other/report?week=2026-10-26",
    );
  });

  // The week chosen before (e.g. before logging out) is not kept anywhere but the URL, so the plain
  // /other/report always opens on the week that is this week at that time
  it("AC-R-1: the URL of this week follows today's Monday, not a week chosen earlier", () => {
    expect(reportHref("2026-03-09", "2026-03-09")).toBe("/other/report");
    expect(reportHref("2026-03-09", "2026-03-16")).toBe(
      "/other/report?week=2026-03-09",
    );
  });
});
