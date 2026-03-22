import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { WeeklyPfcChart } from "@/components/features/report/components/weekly-pfc-chart";
import type { DailyReportEntry } from "@/components/features/report/types/weekly-report";

afterEach(() => {
  cleanup();
});

/** Create 7 daily entries with PFC values */
const createEntries = (
  pfcPerDay: { protein: number; fat: number; carbs: number }[] = Array(7).fill({
    protein: 0,
    fat: 0,
    carbs: 0,
  }),
): DailyReportEntry[] =>
  pfcPerDay.map((pfc, i) => ({
    date: `2026-03-${String(16 + i).padStart(2, "0")}`,
    calories: 0,
    protein: pfc.protein,
    fat: pfc.fat,
    carbs: pfc.carbs,
    totalCost: 0,
  }));

describe("WeeklyPfcChart", () => {
  it("renders the PFC legend with Japanese labels", () => {
    render(
      <WeeklyPfcChart
        entries={createEntries()}
        averageProtein={0}
        averageFat={0}
        averageCarbs={0}
      />,
    );
    expect(screen.getByText("タンパク質")).toBeInTheDocument();
    expect(screen.getByText("脂質")).toBeInTheDocument();
    expect(screen.getByText("炭水化物")).toBeInTheDocument();
  });

  it("renders 7 day labels (月〜日)", () => {
    render(
      <WeeklyPfcChart
        entries={createEntries()}
        averageProtein={0}
        averageFat={0}
        averageCarbs={0}
      />,
    );
    for (const label of ["月", "火", "水", "木", "金", "土", "日"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("shows '平均値を表示' button initially", () => {
    render(
      <WeeklyPfcChart
        entries={createEntries()}
        averageProtein={50}
        averageFat={30}
        averageCarbs={200}
      />,
    );
    expect(screen.getByText(/平均値を表示/)).toBeInTheDocument();
  });

  it("does not show averages initially", () => {
    render(
      <WeeklyPfcChart
        entries={createEntries()}
        averageProtein={50}
        averageFat={30}
        averageCarbs={200}
      />,
    );
    expect(screen.queryByText("50.0")).not.toBeInTheDocument();
  });

  it("shows expanded PFC averages when '平均値を表示' is clicked", async () => {
    const user = userEvent.setup();
    render(
      <WeeklyPfcChart
        entries={createEntries()}
        averageProtein={50}
        averageFat={30}
        averageCarbs={200}
      />,
    );
    await user.click(screen.getByText(/平均値を表示/));
    expect(screen.getByText("50.0")).toBeInTheDocument();
    expect(screen.getByText("30.0")).toBeInTheDocument();
    expect(screen.getByText("200.0")).toBeInTheDocument();
  });

  it("toggles between '平均値を表示' and '閉じる'", async () => {
    const user = userEvent.setup();
    render(
      <WeeklyPfcChart
        entries={createEntries()}
        averageProtein={50}
        averageFat={30}
        averageCarbs={200}
      />,
    );
    await user.click(screen.getByText(/平均値を表示/));
    expect(screen.getByText(/閉じる/)).toBeInTheDocument();
    await user.click(screen.getByText(/閉じる/));
    expect(screen.getByText(/平均値を表示/)).toBeInTheDocument();
  });

  it("hides averages when '閉じる' is clicked", async () => {
    const user = userEvent.setup();
    render(
      <WeeklyPfcChart
        entries={createEntries()}
        averageProtein={50}
        averageFat={30}
        averageCarbs={200}
      />,
    );
    await user.click(screen.getByText(/平均値を表示/));
    expect(screen.getByText("50.0")).toBeInTheDocument();
    await user.click(screen.getByText(/閉じる/));
    expect(screen.queryByText("50.0")).not.toBeInTheDocument();
  });

  it("handles all-zero PFC without error", () => {
    render(
      <WeeklyPfcChart
        entries={createEntries()}
        averageProtein={0}
        averageFat={0}
        averageCarbs={0}
      />,
    );
    expect(screen.getByText("タンパク質")).toBeInTheDocument();
  });

  it("formats decimal averages correctly", async () => {
    const user = userEvent.setup();
    render(
      <WeeklyPfcChart
        entries={createEntries()}
        averageProtein={12.345}
        averageFat={8.9}
        averageCarbs={150.05}
      />,
    );
    await user.click(screen.getByText(/平均値を表示/));
    expect(screen.getByText("12.3")).toBeInTheDocument();
    expect(screen.getByText("8.9")).toBeInTheDocument();
    expect(screen.getByText("150.1")).toBeInTheDocument();
  });
});
