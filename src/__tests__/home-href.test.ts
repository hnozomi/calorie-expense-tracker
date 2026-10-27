import { describe, expect, it } from "vitest";
import { homeHref } from "@/components/features/meals/utils/home-href";

describe("homeHref", () => {
  it("AC-R-3: a day that is not today is in the URL as ?date=", () => {
    expect(homeHref("2026-10-19", "2026-10-20")).toBe("/home?date=2026-10-19");
  });

  it("AC-R-3: a day after today is in the URL as ?date= too", () => {
    expect(homeHref("2026-10-21", "2026-10-20")).toBe("/home?date=2026-10-21");
  });

  it("AC-R-3: today is the plain /home, which opens on today (ui-tech §1)", () => {
    expect(homeHref("2026-10-20", "2026-10-20")).toBe("/home");
  });
});
