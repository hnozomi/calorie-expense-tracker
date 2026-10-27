import { act, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlanWeeklySummary } from "@/components/features/plan/components/plan-weekly-summary";
import { createPlan, renderWithWeeklyPlans } from "./helpers/weekly-plans";

const transferPlansToMeals = vi.fn();
const syncMealsToPlans = vi.fn();
vi.mock("@/components/features/plan/api/actions", () => ({
  transferPlansToMeals: (...args: unknown[]) => transferPlansToMeals(...args),
  syncMealsToPlans: (...args: unknown[]) => syncMealsToPlans(...args),
  saveMealPlan: vi.fn(),
  deleteMealPlan: vi.fn(),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
const toastInfo = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: (...args: unknown[]) => toastInfo(...args),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// The week of 2026-03-16 (Mon) .. 2026-03-22 (Sun)
const WEEK = "2026-03-16";

const renderSummary = ({
  plans = [] as ReturnType<typeof createPlan>[],
  today = "2026-03-18",
  weekStart = WEEK,
  targetCalories = 0,
} = {}) =>
  renderWithWeeklyPlans(<PlanWeeklySummary targetCalories={targetCalories} />, {
    plans,
    today,
    weekStart,
  });

describe("PlanWeeklySummary", () => {
  it("renders week range label", () => {
    renderSummary();
    expect(screen.getByText(/3\/16 - 3\/22/)).toBeInTheDocument();
  });

  it("displays zero totals when no plans", () => {
    renderSummary();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("kcal")).toBeInTheDocument();
    expect(screen.getByText("¥0")).toBeInTheDocument();
  });

  it("calculates total calories from plans", () => {
    renderSummary({
      plans: [
        createPlan({ date: WEEK, calories: 500 }),
        createPlan({ date: WEEK, calories: 700 }),
        createPlan({ date: WEEK, calories: 300 }),
      ],
    });
    expect(screen.getByText("1500")).toBeInTheDocument();
    expect(screen.getByText("kcal")).toBeInTheDocument();
  });

  it("calculates total cost from plans", () => {
    renderSummary({
      plans: [
        createPlan({ date: WEEK, estimatedCost: 300 }),
        createPlan({ date: WEEK, estimatedCost: 450 }),
      ],
    });
    expect(screen.getByText("¥750")).toBeInTheDocument();
  });

  it("displays PFC totals", () => {
    renderSummary({
      plans: [
        createPlan({ date: WEEK, protein: 20, fat: 15, carbs: 60 }),
        createPlan({ date: WEEK, protein: 30, fat: 10, carbs: 40 }),
      ],
    });
    expect(screen.getByText(/P 50\.0/)).toBeInTheDocument();
    expect(screen.getByText(/F 25\.0/)).toBeInTheDocument();
    expect(screen.getByText(/C 100\.0/)).toBeInTheDocument();
  });

  it("shows transfer button when today has plans", () => {
    // "Today" comes from the server through the provider (ui-tech §5), not from the browser's clock
    renderSummary({
      today: "2026-03-18",
      plans: [createPlan({ date: "2026-03-18" })],
    });
    expect(
      screen.getByRole("button", { name: "今日の献立を転記" }),
    ).toBeInTheDocument();
  });

  it("hides transfer button when today has no plans", () => {
    renderSummary({
      today: "2026-03-18",
      plans: [createPlan({ date: "2026-03-17" })],
    });
    expect(
      screen.queryByRole("button", { name: "今日の献立を転記" }),
    ).not.toBeInTheDocument();
  });

  it("rounds calorie totals", () => {
    renderSummary({
      plans: [
        createPlan({ date: WEEK, calories: 333.33 }),
        createPlan({ date: WEEK, calories: 333.33 }),
        createPlan({ date: WEEK, calories: 333.34 }),
      ],
    });
    expect(screen.getByText("1000")).toBeInTheDocument();
  });

  it("compares the total against the daily target times the planned days only", () => {
    // 2 planned days × 2000 = 4000; 2 × 1800 planned = 3600, so 400 under
    renderSummary({
      targetCalories: 2000,
      plans: [
        createPlan({ date: "2026-03-16", calories: 1800 }),
        createPlan({ date: "2026-03-17", calories: 1800 }),
      ],
    });
    expect(screen.getByText(/目標: 4,000 kcal/)).toBeInTheDocument();
    expect(screen.getByText("-400 kcal")).toBeInTheDocument();
    expect(screen.getByText("7日中2日計画済み")).toBeInTheDocument();
  });

  it("shows no target bar while nothing is planned", () => {
    renderSummary({ targetCalories: 2000 });
    expect(screen.queryByText(/目標:/)).not.toBeInTheDocument();
  });
});

describe("今日の献立を転記", () => {
  const TODAY = "2026-03-18";
  const todayPlans = [
    createPlan({ date: TODAY, mealType: "breakfast" }),
    createPlan({ date: TODAY, mealType: "breakfast" }),
    createPlan({ date: TODAY, mealType: "dinner" }),
  ];

  it("P-4: moves each slot of today that has plans, with the server's today", async () => {
    const user = userEvent.setup();
    transferPlansToMeals.mockResolvedValue({ ok: true, transferredCount: 2 });
    renderSummary({ today: TODAY, plans: todayPlans });

    await user.click(screen.getByRole("button", { name: "今日の献立を転記" }));

    await waitFor(() => expect(transferPlansToMeals).toHaveBeenCalledTimes(1));
    const [input] = transferPlansToMeals.mock.calls[0] as [
      { date: string; mealTypes: string[] },
    ];
    expect(input.date).toBe(TODAY);
    expect([...input.mealTypes].sort()).toEqual(["breakfast", "dinner"]);
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        "今日の献立を食事記録に転記しました",
      ),
    );
    expect(toastError).not.toHaveBeenCalled();
  });

  it("AC-R-5: when only some slots were moved, the error says how many of them were", async () => {
    const user = userEvent.setup();
    transferPlansToMeals.mockResolvedValue({ ok: true, transferredCount: 1 });
    renderSummary({ today: TODAY, plans: todayPlans });

    await user.click(screen.getByRole("button", { name: "今日の献立を転記" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError.mock.calls[0][0]).toMatch(/1\/2/);
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("AC-R-5: when the request itself fails, an error is shown instead of the error page", async () => {
    const user = userEvent.setup();
    transferPlansToMeals.mockRejectedValue(new TypeError("Failed to fetch"));
    renderSummary({ today: TODAY, plans: todayPlans });

    await user.click(screen.getByRole("button", { name: "今日の献立を転記" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("転記に失敗しました"),
    );
    expect(
      screen.getByRole("button", { name: "今日の献立を転記" }),
    ).toBeInTheDocument();
  });

  it("共通UI(ボタン操作時): the button is disabled and says 転記中... while the transfer runs", async () => {
    const user = userEvent.setup();
    let finish: (value: unknown) => void = () => {};
    transferPlansToMeals.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderSummary({ today: TODAY, plans: todayPlans });

    await user.click(screen.getByRole("button", { name: "今日の献立を転記" }));

    expect(
      await screen.findByRole("button", { name: "転記中..." }),
    ).toBeDisabled();
    await act(async () => finish({ ok: true, transferredCount: 2 }));
  });
});

describe("実績を反映", () => {
  const confirmSync = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: "実績を反映" }));
    await user.click(await screen.findByRole("button", { name: "反映する" }));
  };

  it("P-2: replaces the past days of the week, up to yesterday", async () => {
    const user = userEvent.setup();
    syncMealsToPlans.mockResolvedValue({ ok: true, replacedCount: 3 });
    renderSummary({ today: "2026-03-18" });

    await confirmSync(user);

    await waitFor(() =>
      expect(syncMealsToPlans).toHaveBeenCalledWith({
        startDate: "2026-03-16",
        endDate: "2026-03-17",
      }),
    );
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        "3枠の献立を実際の食事内容で置き換えました",
      ),
    );
  });

  it("P-2: a past week is replaced up to its Sunday", async () => {
    const user = userEvent.setup();
    syncMealsToPlans.mockResolvedValue({ ok: true, replacedCount: 1 });
    renderSummary({ today: "2026-10-27" });

    await confirmSync(user);

    await waitFor(() =>
      expect(syncMealsToPlans).toHaveBeenCalledWith({
        startDate: "2026-03-16",
        endDate: "2026-03-22",
      }),
    );
  });

  it("P-2: has nothing to replace on the Monday of this week or in a future week", () => {
    renderSummary({ today: "2026-03-16" });
    expect(
      screen.queryByRole("button", { name: "実績を反映" }),
    ).not.toBeInTheDocument();
  });

  it("P-2: says so when there was no meal record to replace with", async () => {
    const user = userEvent.setup();
    syncMealsToPlans.mockResolvedValue({ ok: true, replacedCount: 0 });
    renderSummary({ today: "2026-03-18" });

    await confirmSync(user);

    await waitFor(() =>
      expect(toastInfo).toHaveBeenCalledWith(
        "反映できる食事記録がありませんでした",
      ),
    );
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("AC-R-5: a failed sync shows an error", async () => {
    const user = userEvent.setup();
    syncMealsToPlans.mockResolvedValue({ ok: false });
    renderSummary({ today: "2026-03-18" });

    await confirmSync(user);

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("実績の反映に失敗しました"),
    );
  });
});
