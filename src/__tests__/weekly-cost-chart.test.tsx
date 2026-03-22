import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WeeklyCostChart } from "@/components/features/report/components/weekly-cost-chart";
import type { DailyReportEntry } from "@/components/features/report/types/weekly-report";

afterEach(() => {
  cleanup();
});

/** Create 7 daily entries for testing */
const createEntries = (
  costsPerDay: number[] = [0, 0, 0, 0, 0, 0, 0],
): DailyReportEntry[] =>
  costsPerDay.map((cost, i) => ({
    date: `2026-03-${String(16 + i).padStart(2, "0")}`,
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    totalCost: cost,
  }));

describe("WeeklyCostChart", () => {
  it("displays total cost", () => {
    render(
      <WeeklyCostChart
        entries={createEntries()}
        averageCost={500}
        totalCost={3500}
      />,
    );
    expect(screen.getByText(/¥3,500/)).toBeInTheDocument();
  });

  it("displays average cost per day", () => {
    render(
      <WeeklyCostChart
        entries={createEntries()}
        averageCost={500}
        totalCost={3500}
      />,
    );
    expect(screen.getByText(/¥500/)).toBeInTheDocument();
    expect(screen.getByText(/\/日/)).toBeInTheDocument();
  });

  it("rounds cost values to integers", () => {
    render(
      <WeeklyCostChart
        entries={createEntries()}
        averageCost={456.78}
        totalCost={3197.46}
      />,
    );
    expect(screen.getByText(/¥3,197/)).toBeInTheDocument();
    expect(screen.getByText(/¥457/)).toBeInTheDocument();
  });

  it("renders 7 day labels (月〜日)", () => {
    render(
      <WeeklyCostChart
        entries={createEntries()}
        averageCost={0}
        totalCost={0}
      />,
    );
    for (const label of ["月", "火", "水", "木", "金", "土", "日"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("handles all-zero costs without error", () => {
    render(
      <WeeklyCostChart
        entries={createEntries()}
        averageCost={0}
        totalCost={0}
      />,
    );
    expect(screen.getAllByText(/¥0/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders average dashed line when averageCost > 0", () => {
    render(
      <WeeklyCostChart
        entries={createEntries([300, 500, 400, 600, 350, 800, 450])}
        averageCost={486}
        totalCost={3400}
      />,
    );
    expect(screen.getByText("平均")).toBeInTheDocument();
  });
});
