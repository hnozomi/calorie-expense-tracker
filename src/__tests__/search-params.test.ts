import { describe, expect, it } from "vitest";
import { parseDateParam, parseWeekParam } from "@/utils/search-params";

describe("parseDateParam", () => {
  it("AC-R-3: no ?date= is reported as absent so the page can fall back to today", () => {
    expect(parseDateParam(undefined)).toEqual({ status: "absent" });
  });

  it("AC-R-3: a real YYYY-MM-DD date is kept as it is", () => {
    expect(parseDateParam("2026-10-20")).toEqual({
      status: "valid",
      value: "2026-10-20",
    });
  });

  it("AC-R-3: a leap day is a real date", () => {
    expect(parseDateParam("2028-02-29")).toEqual({
      status: "valid",
      value: "2028-02-29",
    });
  });

  it.each([
    ["an empty value", ""],
    ["text that is not a date", "today"],
    ["a date without zero padding", "2026-1-2"],
    ["a date with a time", "2026-10-20T00:00"],
    ["a day that does not exist", "2026-02-30"],
    ["Feb 29 in a non-leap year", "2026-02-29"],
    ["a month that does not exist", "2026-13-01"],
  ])("AC-R-3: %s is invalid so the page can return 404", (_, value) => {
    expect(parseDateParam(value)).toEqual({ status: "invalid" });
  });

  it("AC-R-3: a repeated ?date= (string array) is invalid", () => {
    expect(parseDateParam(["2026-10-20", "2026-10-21"])).toEqual({
      status: "invalid",
    });
  });
});

describe("parseWeekParam", () => {
  it("AC-R-3: no ?week= is reported as absent so the page can fall back to this Monday", () => {
    expect(parseWeekParam(undefined)).toEqual({ status: "absent" });
  });

  it("AC-R-3: a Monday is kept as it is", () => {
    expect(parseWeekParam("2026-10-19")).toEqual({
      status: "valid",
      value: "2026-10-19",
    });
  });

  it("AC-R-3: a day that is not Monday moves to the Monday of its week instead of 404", () => {
    expect(parseWeekParam("2026-10-22")).toEqual({
      status: "valid",
      value: "2026-10-19",
    });
  });

  it("AC-R-3: a Sunday moves to the Monday six days earlier", () => {
    expect(parseWeekParam("2026-10-25")).toEqual({
      status: "valid",
      value: "2026-10-19",
    });
  });

  it("AC-R-3: a Sunday early in January moves to the Monday of the previous year", () => {
    expect(parseWeekParam("2027-01-03")).toEqual({
      status: "valid",
      value: "2026-12-28",
    });
  });

  it.each([
    ["text that is not a date", "next"],
    ["a day that does not exist", "2026-02-30"],
  ])("AC-R-3: %s is invalid so the page can return 404", (_, value) => {
    expect(parseWeekParam(value)).toEqual({ status: "invalid" });
  });

  it("AC-R-3: a repeated ?week= (string array) is invalid", () => {
    expect(parseWeekParam(["2026-10-19"])).toEqual({ status: "invalid" });
  });
});
