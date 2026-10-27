import { describe, expect, it } from "vitest";
import {
  buildWeeklyReport,
  hasReportData,
  type WeeklySummaryRow,
} from "@/components/features/report/utils/build-weekly-report";

// S-09: the weekly report shows each day's calories, PFC and food cost, with the averages and the week's total.
// The look and the numbers must not change with the rebuild (ui-tech: 画面の見た目と操作は変えない), so the
// expectations follow the report as it was: averages over the days that have calories, totals over the week.

const WEEK = "2026-10-19";

const dayOf = (offset: number) =>
  `2026-10-${String(19 + offset).padStart(2, "0")}`;

const row = (
  offset: number,
  values: Partial<Omit<WeeklySummaryRow, "date">> = {},
): WeeklySummaryRow => ({
  date: dayOf(offset),
  total_calories: 0,
  total_protein: 0,
  total_fat: 0,
  total_carbs: 0,
  total_cost: 0,
  ...values,
});

/** The RPC returns all 7 days of the week, with zeros on days without records */
const emptyWeek = () => [0, 1, 2, 3, 4, 5, 6].map((offset) => row(offset));

describe("buildWeeklyReport (S-09 の週の集計)", () => {
  it("S-09: 7日分の行を、日付ごとのカロリー・PFC・食費に直して並べる", () => {
    const rows = emptyWeek();
    rows[2] = row(2, {
      total_calories: 1800,
      total_protein: 80,
      total_fat: 50,
      total_carbs: 220,
      total_cost: 1200,
    });

    const report = buildWeeklyReport(WEEK, rows);

    expect(report.weekStart).toBe(WEEK);
    expect(report.entries).toHaveLength(7);
    expect(report.entries.map((entry) => entry.date)).toEqual(
      [0, 1, 2, 3, 4, 5, 6].map(dayOf),
    );
    expect(report.entries[2]).toEqual({
      date: "2026-10-21",
      calories: 1800,
      protein: 80,
      fat: 50,
      carbs: 220,
      totalCost: 1200,
    });
  });

  it("S-09: 平均は記録のある日(カロリーが 0 より大きい日)だけで割り、食費の合計は週の全部を足す", () => {
    const rows = emptyWeek();
    rows[0] = row(0, {
      total_calories: 2000,
      total_protein: 90,
      total_fat: 60,
      total_carbs: 250,
      total_cost: 1000,
    });
    rows[3] = row(3, {
      total_calories: 1000,
      total_protein: 30,
      total_fat: 20,
      total_carbs: 150,
      total_cost: 500,
    });

    const report = buildWeeklyReport(WEEK, rows);

    expect(report.averageCalories).toBe(1500);
    expect(report.averageProtein).toBe(60);
    expect(report.averageFat).toBe(40);
    expect(report.averageCarbs).toBe(200);
    expect(report.averageCost).toBe(750);
    expect(report.totalCost).toBe(1500);
  });

  it("S-09: カロリーが 0 の日の食費も合計に入るが、平均の日数には数えない", () => {
    const rows = emptyWeek();
    rows[0] = row(0, { total_calories: 600, total_cost: 300 });
    rows[1] = row(1, { total_calories: 0, total_cost: 200 });

    const report = buildWeeklyReport(WEEK, rows);

    expect(report.totalCost).toBe(500);
    expect(report.averageCost).toBe(500);
    expect(report.averageCalories).toBe(600);
  });

  it("02 空状態: 記録の無い週は、平均も合計も 0(0 で割らない)", () => {
    const report = buildWeeklyReport(WEEK, emptyWeek());

    expect(report.averageCalories).toBe(0);
    expect(report.averageProtein).toBe(0);
    expect(report.averageFat).toBe(0);
    expect(report.averageCarbs).toBe(0);
    expect(report.averageCost).toBe(0);
    expect(report.totalCost).toBe(0);
  });

  it("02 空状態: RPC が行を返さなくても(0 行)、空の週として作る", () => {
    const report = buildWeeklyReport(WEEK, []);

    expect(report.entries).toEqual([]);
    expect(report.averageCalories).toBe(0);
    expect(report.totalCost).toBe(0);
  });

  it("S-09: RPC の numeric が文字で届いても、数として足す", () => {
    const rows = emptyWeek();
    rows[0] = {
      ...row(0),
      total_calories: "450.5" as unknown as number,
      total_cost: "120" as unknown as number,
    };
    rows[1] = {
      ...row(1),
      total_calories: "549.5" as unknown as number,
      total_cost: "80" as unknown as number,
    };

    const report = buildWeeklyReport(WEEK, rows);

    expect(report.entries[0].calories).toBe(450.5);
    expect(report.averageCalories).toBe(500);
    expect(report.totalCost).toBe(200);
  });
});

describe("hasReportData (S-09 の空の週)", () => {
  it("02 空状態: どの日もすべて 0 の週は、記録が無いとみなす", () => {
    expect(hasReportData(buildWeeklyReport(WEEK, emptyWeek()))).toBe(false);
  });

  it("02 空状態: 行が無い週も、記録が無いとみなす", () => {
    expect(hasReportData(buildWeeklyReport(WEEK, []))).toBe(false);
  });

  it.each([
    ["カロリー", { total_calories: 1 }],
    ["食費", { total_cost: 1 }],
    ["P", { total_protein: 1 }],
    ["F", { total_fat: 1 }],
    ["C", { total_carbs: 1 }],
  ])("S-09: 1日でも%sがあれば、記録がある週とみなす", (_, values) => {
    const rows = emptyWeek();
    rows[6] = row(6, values);

    expect(hasReportData(buildWeeklyReport(WEEK, rows))).toBe(true);
  });
});
