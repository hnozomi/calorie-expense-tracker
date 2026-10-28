import { cleanup, render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReportContent } from "@/components/features/report/components/report-content";
import { ReportSection } from "@/components/features/report/components/report-section";
import type { WeeklyReport } from "@/components/features/report/types/weekly-report";

// The DB read (getWeeklyReport), "today" on the server, the route's 404 and next/link are the boundary here

const getWeeklyReport = vi.fn();
vi.mock("@/components/features/report/api/queries", () => ({
  getWeeklyReport: (...args: unknown[]) => getWeeklyReport(...args),
}));

const getToday = vi.fn();
vi.mock("@/lib/today", () => ({
  getToday: () => getToday(),
}));

class NotFoundError extends Error {}
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new NotFoundError("NEXT_NOT_FOUND");
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    prefetch,
    children,
    ...props
  }: {
    href: string;
    prefetch?: boolean | null;
    children: ReactNode;
  }) => (
    <a href={href} data-prefetch={String(prefetch)} {...props}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  // A Wednesday: this week starts on Monday 2026-10-19
  getToday.mockResolvedValue("2026-10-21");
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const THIS_MONDAY = "2026-10-19";

const createReport = (
  weekStart: string,
  calories: number[] = [0, 0, 0, 0, 0, 0, 0],
): WeeklyReport => {
  const [year, month, day] = weekStart.split("-").map(Number);
  const entries = calories.map((dayCalories, offset) => ({
    date: new Date(Date.UTC(year, month - 1, day + offset))
      .toISOString()
      .slice(0, 10),
    calories: dayCalories,
    protein: dayCalories > 0 ? 50 : 0,
    fat: dayCalories > 0 ? 20 : 0,
    carbs: dayCalories > 0 ? 100 : 0,
    totalCost: dayCalories > 0 ? 500 : 0,
  }));
  const recorded = entries.filter((entry) => entry.calories > 0);
  const divisor = Math.max(recorded.length, 1);
  const totalCost = entries.reduce((sum, entry) => sum + entry.totalCost, 0);
  return {
    weekStart,
    entries,
    averageCalories:
      entries.reduce((sum, entry) => sum + entry.calories, 0) / divisor,
    averageProtein: recorded.length > 0 ? 50 : 0,
    averageFat: recorded.length > 0 ? 20 : 0,
    averageCarbs: recorded.length > 0 ? 100 : 0,
    averageCost: totalCost / divisor,
    totalCost,
  };
};

const renderContent = async (weekStart: string) => {
  render(await ReportContent({ weekStart, thisMonday: THIS_MONDAY }));
};

describe("ReportContent (S-09 ウィークリーレポート)", () => {
  it("AC-R-2: 表示する週の集計をサーバーで読んで出す", async () => {
    getWeeklyReport.mockResolvedValue(
      createReport("2026-10-12", [1800, 0, 0, 0, 0, 0, 2200]),
    );

    await renderContent("2026-10-12");

    expect(getWeeklyReport).toHaveBeenCalledWith("2026-10-12");
    expect(
      screen.getByRole("link", { name: /^月曜日 1800kcal/ }),
    ).toHaveAttribute("href", "/home?date=2026-10-12");
    expect(screen.getByText("平均 2000 kcal/日")).toBeInTheDocument();
    expect(screen.getByText("合計 ¥1,000")).toBeInTheDocument();
  });

  it("S-09: 記録のある週は、カロリー・PFCバランス・食費の3つを出す", async () => {
    getWeeklyReport.mockResolvedValue(
      createReport(THIS_MONDAY, [1500, 0, 0, 0, 0, 0, 0]),
    );

    await renderContent(THIS_MONDAY);

    expect(screen.getByText("カロリー")).toBeInTheDocument();
    expect(screen.getByText("PFCバランス")).toBeInTheDocument();
    expect(screen.getByText("食費")).toBeInTheDocument();
    expect(
      screen.queryByText("この週の記録はありません"),
    ).not.toBeInTheDocument();
  });

  it("02 空状態: 記録の無い週は「この週の記録はありません」と、記録の仕方を出し、グラフは出さない", async () => {
    getWeeklyReport.mockResolvedValue(createReport("2026-10-12"));

    await renderContent("2026-10-12");

    expect(screen.getByText("この週の記録はありません")).toBeInTheDocument();
    expect(
      screen.getByText("ホーム画面から食事を登録するとレポートが表示されます"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /タップで日別画面へ/ }),
    ).not.toBeInTheDocument();
  });

  it("AC-R-3: 前の週・次の週は ?week= の付いたリンクで、今週に戻るときは /other/report", async () => {
    getWeeklyReport.mockResolvedValue(createReport("2026-10-12"));

    await renderContent("2026-10-12");

    expect(screen.getByRole("link", { name: "前の週" })).toHaveAttribute(
      "href",
      "/other/report?week=2026-10-05",
    );
    expect(screen.getByRole("link", { name: "次の週" })).toHaveAttribute(
      "href",
      "/other/report",
    );
    expect(screen.getByRole("link", { name: "今週へ" })).toHaveAttribute(
      "href",
      "/other/report",
    );
  });

  it("AC-R-3: 今週を見ているときは「今週」と出し、次の週は ?week= の付いた URL", async () => {
    getWeeklyReport.mockResolvedValue(createReport(THIS_MONDAY));

    await renderContent(THIS_MONDAY);

    expect(screen.getByText("今週")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "今週へ" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "次の週" })).toHaveAttribute(
      "href",
      "/other/report?week=2026-10-26",
    );
  });

  it("08 読めなかった: 集計が読めなければ例外のまま(error.tsx に任せ、空の週と見せない)", async () => {
    getWeeklyReport.mockRejectedValue(new Error("rpc failed"));

    await expect(
      ReportContent({ weekStart: THIS_MONDAY, thisMonday: THIS_MONDAY }),
    ).rejects.toThrow("rpc failed");
  });
});

type ContentProps = { weekStart: string; thisMonday: string };

/** The week ReportSection hands to ReportContent, and the key of the Suspense around it */
const sectionFor = async (week: string | string[] | undefined) => {
  const element = (await ReportSection({
    searchParams: Promise.resolve(week === undefined ? {} : { week }),
  })) as ReactElement<{ children: ReactElement<ContentProps> }>;
  return { key: element.key, content: element.props.children.props };
};

describe("ReportSection (/other/report?week=)", () => {
  it("AC-R-3: ?week= が無ければ今週(Asia/Tokyo の今日の週の月曜)を出す", async () => {
    const { content } = await sectionFor(undefined);

    expect(content).toEqual({
      weekStart: THIS_MONDAY,
      thisMonday: THIS_MONDAY,
    });
  });

  it("AC-R-3: ?week= の週を出す", async () => {
    const { content } = await sectionFor("2026-10-12");

    expect(content.weekStart).toBe("2026-10-12");
    expect(content.thisMonday).toBe(THIS_MONDAY);
  });

  it("ui-tech §1: 月曜でない ?week= は、その日を含む週の月曜に直す(404 にしない)", async () => {
    const { content } = await sectionFor("2026-10-15");

    expect(content.weekStart).toBe("2026-10-12");
  });

  it.each([
    ["日付でない文字", "next-week"],
    ["無い日", "2026-02-30"],
  ])("ui-tech §1: 形の違う ?week=(%s)は 404 にする", async (_, week) => {
    await expect(sectionFor(week)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("AC-R-3: 週ごとに Suspense の key が変わり、別の週に移ると前の週の集計を出したままにしない", async () => {
    const thisWeek = await sectionFor(undefined);
    const lastWeek = await sectionFor("2026-10-12");

    expect(thisWeek.key).toBe(THIS_MONDAY);
    expect(lastWeek.key).toBe("2026-10-12");
  });
});
