import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WeekNavigator } from "@/components/features/plan/components/week-navigator";

afterEach(() => {
  cleanup();
});

const THIS_MONDAY = "2026-10-19";

describe("WeekNavigator", () => {
  it("S-07: this week is marked 今週 and has no 今週へ", () => {
    render(<WeekNavigator weekStart={THIS_MONDAY} thisMonday={THIS_MONDAY} />);
    expect(screen.getByText("今週")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "今週へ" }),
    ).not.toBeInTheDocument();
  });

  it("AC-R-3: the previous week is a link to /plan?week= of its Monday", () => {
    render(<WeekNavigator weekStart={THIS_MONDAY} thisMonday={THIS_MONDAY} />);
    expect(screen.getByRole("link", { name: "前の週" })).toHaveAttribute(
      "href",
      "/plan?week=2026-10-12",
    );
  });

  it("AC-R-3: the next week is a link to /plan?week= of its Monday", () => {
    render(<WeekNavigator weekStart={THIS_MONDAY} thisMonday={THIS_MONDAY} />);
    expect(screen.getByRole("link", { name: "次の週" })).toHaveAttribute(
      "href",
      "/plan?week=2026-10-26",
    );
  });

  it("AC-R-3: from the next week, the previous week is this week's plain /plan", () => {
    render(<WeekNavigator weekStart="2026-10-26" thisMonday={THIS_MONDAY} />);
    expect(screen.getByRole("link", { name: "前の週" })).toHaveAttribute(
      "href",
      "/plan",
    );
  });

  it("AC-R-3: another week has 今週へ, a link to /plan, and no 今週 mark", () => {
    render(<WeekNavigator weekStart="2026-10-05" thisMonday={THIS_MONDAY} />);
    expect(screen.getByRole("link", { name: "今週へ" })).toHaveAttribute(
      "href",
      "/plan",
    );
    expect(screen.queryByText("今週")).not.toBeInTheDocument();
  });

  it("AC-R-3: the weeks before and after cross the year boundary", () => {
    render(<WeekNavigator weekStart="2026-12-28" thisMonday={THIS_MONDAY} />);
    expect(screen.getByRole("link", { name: "次の週" })).toHaveAttribute(
      "href",
      "/plan?week=2027-01-04",
    );
    expect(screen.getByRole("link", { name: "前の週" })).toHaveAttribute(
      "href",
      "/plan?week=2026-12-21",
    );
  });

  it("S-07: shows the week being looked at", () => {
    render(<WeekNavigator weekStart="2026-10-05" thisMonday={THIS_MONDAY} />);
    expect(screen.getByText(/2026\/10\/5/)).toBeInTheDocument();
  });
});
