import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WeeklyCalorieChart } from "@/components/features/report/components/weekly-calorie-chart";
import type { DailyReportEntry } from "@/components/features/report/types/weekly-report";

afterEach(() => {
  cleanup();
});

/** Create 7 daily entries for testing */
const createEntries = (
  caloriesPerDay: number[] = [0, 0, 0, 0, 0, 0, 0],
): DailyReportEntry[] =>
  caloriesPerDay.map((cal, i) => ({
    date: `2026-03-${String(16 + i).padStart(2, "0")}`,
    calories: cal,
    protein: 0,
    fat: 0,
    carbs: 0,
    totalCost: 0,
  }));

describe("WeeklyCalorieChart", () => {
  it("renders the average dashed line label when average > 0", () => {
    render(
      <WeeklyCalorieChart entries={createEntries()} averageCalories={1500} />,
    );
    expect(screen.getByText("平均")).toBeInTheDocument();
  });

  it("does not render average label when averageCalories is 0", () => {
    render(
      <WeeklyCalorieChart entries={createEntries()} averageCalories={0} />,
    );
    expect(screen.queryByText("平均")).not.toBeInTheDocument();
  });

  it("renders 7 day labels (月〜日)", () => {
    render(
      <WeeklyCalorieChart entries={createEntries()} averageCalories={0} />,
    );
    for (const label of ["月", "火", "水", "木", "金", "土", "日"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  // Phase 5: the bars are links (a pushed route could not be opened like any other screen, CLAUDE.md Performance)
  it("S-09: renders the 7 bars as links to the daily view", () => {
    render(
      <WeeklyCalorieChart entries={createEntries()} averageCalories={0} />,
    );
    const links = screen.getAllByRole("link", { name: /タップで日別画面へ/ });
    expect(links).toHaveLength(7);
  });

  it("S-09: tapping a bar opens that day's daily view (/home?date=, AC-R-3)", () => {
    render(
      <WeeklyCalorieChart
        entries={createEntries([2000, 1800, 1600, 1500, 1700, 2200, 1900])}
        averageCalories={1814}
      />,
    );
    expect(
      screen.getByRole("link", { name: /^月曜日 2000kcal/ }),
    ).toHaveAttribute("href", "/home?date=2026-03-16");
  });

  it("S-09: each bar links to its own day, the last one to Sunday", () => {
    render(
      <WeeklyCalorieChart
        entries={createEntries([100, 200, 300, 400, 500, 600, 700])}
        averageCalories={400}
      />,
    );
    const links = screen.getAllByRole("link", { name: /タップで日別画面へ/ });
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/home?date=2026-03-16",
      "/home?date=2026-03-17",
      "/home?date=2026-03-18",
      "/home?date=2026-03-19",
      "/home?date=2026-03-20",
      "/home?date=2026-03-21",
      "/home?date=2026-03-22",
    ]);
    expect(links[6]).toHaveAccessibleName(/^日曜日 700kcal/);
  });

  it("handles all-zero calories without error", () => {
    render(
      <WeeklyCalorieChart entries={createEntries()} averageCalories={0} />,
    );
    // Should render 7 day labels without crashing
    expect(screen.getByText("月")).toBeInTheDocument();
    expect(screen.getByText("日")).toBeInTheDocument();
  });
});
