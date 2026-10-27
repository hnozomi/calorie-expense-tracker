import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Component, type ReactNode } from "react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { PlanCalendarGrid } from "@/components/features/plan/components/plan-calendar-grid";
import { PlanWeeklySummary } from "@/components/features/plan/components/plan-weekly-summary";
import type { MealPlan } from "@/components/features/plan/types/meal-plan";
import type { ActionResult } from "@/lib/action-result";
import { deferred } from "./helpers/daily-meals";
import {
  createPlan,
  renderWithWeeklyPlansSettled,
} from "./helpers/weekly-plans";

const saveMealPlan = vi.fn();
const deleteMealPlan = vi.fn();
vi.mock("@/components/features/plan/api/actions", () => ({
  saveMealPlan: (...args: unknown[]) => saveMealPlan(...args),
  deleteMealPlan: (...args: unknown[]) => deleteMealPlan(...args),
  transferPlansToMeals: vi.fn(),
  syncMealsToPlans: vi.fn(),
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: (...args: unknown[]) => toastError(...args),
    info: vi.fn(),
  },
}));

// The grid's ScrollArea (Radix) measures itself with ResizeObserver, which jsdom does not have
beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/** Stands in for src/app/error.tsx: if the failure escapes to it, the whole screen is replaced and the grid is gone */
class ScreenErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? (
      <p>エラーが発生しました</p>
    ) : (
      this.props.children
    );
  }
}

/** Settle the Server Action and let React end the transition, which drops the optimistic change */
const settle = async (
  pending: ReturnType<typeof deferred<ActionResult>>,
  result: ActionResult,
) => {
  await act(async () => {
    pending.resolve(result);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const failRequest = async (
  pending: ReturnType<typeof deferred<ActionResult>>,
) => {
  await act(async () => {
    pending.reject(new TypeError("Failed to fetch"));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const renderPlanScreen = (plans: MealPlan[] = []) =>
  renderWithWeeklyPlansSettled(
    <ScreenErrorBoundary>
      <PlanCalendarGrid targetCalories={0} />
      <PlanWeeklySummary targetCalories={0} />
    </ScreenErrorBoundary>,
    { weekStart: "2026-10-19", today: "2026-10-20", plans },
  );

/** The weekly summary's calorie total (the large number next to "kcal") */
const weeklyCalories = () =>
  screen.getByText("カロリー").nextElementSibling?.firstChild?.textContent;

const user = () => userEvent.setup();

/** Open a cell's dialog. The dialog is the first to use() the candidates, which React takes up inside act */
const openDialogWith = async (
  u: ReturnType<typeof userEvent.setup>,
  trigger: HTMLElement,
) => {
  await act(async () => {
    await u.click(trigger);
  });
  return screen.getByRole("dialog");
};

const addToFirstCell = async (
  u: ReturnType<typeof userEvent.setup>,
  name: string,
  calories: string,
) => {
  const [firstAdd] = screen.getAllByRole("button", { name: "献立を追加" });
  const dialog = await openDialogWith(u, firstAdd);
  await u.type(within(dialog).getByLabelText("メニュー名"), name);
  await u.type(within(dialog).getByLabelText("カロリー (kcal)"), calories);
  await u.click(within(dialog).getByRole("button", { name: "保存" }));
};

describe("押した直後の表示(useOptimistic)", () => {
  it("AC-R-5: a saved plan shows in its cell and in the weekly total before the server answers, and the dialog closes at once", async () => {
    const u = user();
    const pending = deferred<ActionResult>();
    saveMealPlan.mockReturnValue(pending.promise);
    await renderPlanScreen();
    expect(weeklyCalories()).toBe("0");

    await addToFirstCell(u, "親子丼", "650");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Still being saved: shown, but it has no id to edit yet
    expect(screen.getByRole("button", { name: "親子丼" })).toBeDisabled();
    expect(weeklyCalories()).toBe("650");

    await settle(pending, { ok: true });
  });

  it("AC-R-5: when saving fails the plan leaves the cell, an error naming it is shown, and the dialog opens again with what was typed", async () => {
    const u = user();
    const pending = deferred<ActionResult>();
    saveMealPlan.mockReturnValue(pending.promise);
    await renderPlanScreen();
    await addToFirstCell(u, "親子丼", "650");
    expect(screen.getByRole("button", { name: "親子丼" })).toBeInTheDocument();

    await settle(pending, { ok: false });

    expect(toastError).toHaveBeenCalledWith("「親子丼」の保存に失敗しました");
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText("メニュー名")).toHaveValue("親子丼");
    expect(within(dialog).getByLabelText("カロリー (kcal)")).toHaveValue(650);

    await u.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: "親子丼" }),
    ).not.toBeInTheDocument();
    expect(weeklyCalories()).toBe("0");
  });

  it("AC-R-5: when the request itself fails (no connection), the change is undone without replacing the screen", async () => {
    const u = user();
    const pending = deferred<ActionResult>();
    saveMealPlan.mockReturnValue(pending.promise);
    await renderPlanScreen();
    await addToFirstCell(u, "親子丼", "650");

    await failRequest(pending);

    expect(screen.queryByText("エラーが発生しました")).not.toBeInTheDocument();
    expect(toastError).toHaveBeenCalledWith("「親子丼」の保存に失敗しました");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("AC-R-5: an edited plan shows its new name and values at once", async () => {
    const u = user();
    const pending = deferred<ActionResult>();
    saveMealPlan.mockReturnValue(pending.promise);
    await renderPlanScreen([
      createPlan({
        id: "plan-1",
        date: "2026-10-19",
        plannedName: "鮭定食",
        calories: 500,
      }),
    ]);

    const dialog = await openDialogWith(
      u,
      screen.getByRole("button", { name: "鮭定食" }),
    );
    const calories = within(dialog).getByLabelText("カロリー (kcal)");
    await u.clear(calories);
    await u.type(calories, "720");
    await u.click(within(dialog).getByRole("button", { name: "保存" }));

    expect(screen.getByRole("button", { name: "鮭定食" })).toBeDisabled();
    expect(weeklyCalories()).toBe("720");
    expect(saveMealPlan).toHaveBeenCalledWith(
      expect.objectContaining({ id: "plan-1" }),
    );

    await settle(pending, { ok: true });
  });

  it("AC-R-5: a deleted plan leaves the cell and the total at once, and comes back with an error when deleting fails", async () => {
    const u = user();
    const pending = deferred<ActionResult>();
    deleteMealPlan.mockReturnValue(pending.promise);
    await renderPlanScreen([
      createPlan({
        id: "plan-1",
        date: "2026-10-19",
        plannedName: "鮭定食",
        calories: 500,
      }),
    ]);
    expect(weeklyCalories()).toBe("500");

    const dialog = await openDialogWith(
      u,
      screen.getByRole("button", { name: "鮭定食" }),
    );
    await u.click(
      within(dialog).getByRole("button", { name: "この献立を削除する" }),
    );
    await u.click(await screen.findByRole("button", { name: "削除する" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "鮭定食" }),
      ).not.toBeInTheDocument(),
    );
    expect(weeklyCalories()).toBe("0");

    await settle(pending, { ok: false });

    expect(toastError).toHaveBeenCalledWith("「鮭定食」の削除に失敗しました");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await u.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "鮭定食" })).toBeEnabled(),
    );
    expect(weeklyCalories()).toBe("500");
  });

  it("S-07: an empty cell opens the dialog to add, and a planned cell opens it with the delete option", async () => {
    const u = user();
    await renderPlanScreen([
      createPlan({ id: "plan-1", date: "2026-10-19", plannedName: "鮭定食" }),
    ]);

    const [firstAdd] = screen.getAllByRole("button", { name: "献立を追加" });
    let dialog = await openDialogWith(u, firstAdd);
    expect(within(dialog).getByLabelText("メニュー名")).toHaveValue("");
    expect(
      within(dialog).queryByRole("button", { name: "この献立を削除する" }),
    ).not.toBeInTheDocument();
    await u.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    dialog = await openDialogWith(
      u,
      screen.getByRole("button", { name: "鮭定食" }),
    );
    expect(within(dialog).getByLabelText("メニュー名")).toHaveValue("鮭定食");
    expect(
      within(dialog).getByRole("button", { name: "この献立を削除する" }),
    ).toBeInTheDocument();
  });

  it("S-07: the grid has a column for each day of the week and a row for each meal, with an add button in every cell", async () => {
    await renderPlanScreen();
    // 7 days × 朝食・昼食・夕食・間食
    expect(screen.getAllByRole("button", { name: "献立を追加" })).toHaveLength(
      28,
    );
    for (const label of ["朝食", "昼食", "夕食", "間食", "合計"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
