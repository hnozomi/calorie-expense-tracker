import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WeeklyCalorieChart } from "@/components/features/report/components/weekly-calorie-chart";
import type { DailyReportEntry } from "@/components/features/report/types/weekly-report";

/** Mock next/navigation */
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

afterEach(() => {
  cleanup();
  mockPush.mockClear();
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

  it("renders 7 clickable bars", () => {
    render(
      <WeeklyCalorieChart entries={createEntries()} averageCalories={0} />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(7);
  });

  it("navigates to daily view on bar click", async () => {
    const user = userEvent.setup();
    render(
      <WeeklyCalorieChart
        entries={createEntries([2000, 1800, 1600, 1500, 1700, 2200, 1900])}
        averageCalories={1814}
      />,
    );
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    expect(mockPush).toHaveBeenCalledWith("/home?date=2026-03-16");
  });

  it("navigates to the correct date for each bar", async () => {
    const user = userEvent.setup();
    render(
      <WeeklyCalorieChart
        entries={createEntries([100, 200, 300, 400, 500, 600, 700])}
        averageCalories={400}
      />,
    );
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[6]);
    expect(mockPush).toHaveBeenCalledWith("/home?date=2026-03-22");
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
