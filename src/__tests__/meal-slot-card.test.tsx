import { act, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Component, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MealSlotCard } from "@/components/features/meals/components/meal-slot-card";
import {
  drawerMealTypeAtom,
  isDrawerOpenAtom,
} from "@/components/features/meals/stores/meal-register-atom";
import type { ActionResult } from "@/lib/action-result";
import {
  createMealItem,
  deferred,
  renderWithDailyMeals,
} from "./helpers/daily-meals";

const copyPreviousDayMeal = vi.fn();
const transferMealToPlan = vi.fn();
vi.mock("@/components/features/meals/api/actions", () => ({
  copyPreviousDayMeal: (...args: unknown[]) => copyPreviousDayMeal(...args),
  transferMealToPlan: (...args: unknown[]) => transferMealToPlan(...args),
  registerMealItems: vi.fn(),
  updateMealItem: vi.fn(),
  deleteMealItem: vi.fn(),
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

const DAY = "2026-10-19";

/** Stands in for src/app/error.tsx: if the failure escapes to it, the whole screen is replaced */
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

describe("MealSlotCard", () => {
  it.each([
    ["breakfast", "朝食"],
    ["lunch", "昼食"],
    ["dinner", "夕食"],
    ["snack", "間食"],
  ] as const)("S-01: the %s slot is labelled %s", (mealType, label) => {
    renderWithDailyMeals(<MealSlotCard mealType={mealType} items={[]} />);
    expect(
      screen.getByRole("region", { name: `${label}の記録` }),
    ).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("S-01: an empty slot offers 登録する and 前日をコピー", () => {
    renderWithDailyMeals(<MealSlotCard mealType="lunch" items={[]} />);
    expect(
      screen.getByRole("button", { name: /登録する/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /前日をコピー/ }),
    ).toBeInTheDocument();
  });

  it("S-01: a slot with items lists them by name", () => {
    renderWithDailyMeals(
      <MealSlotCard
        mealType="dinner"
        items={[
          createMealItem({ name: "サラダチキン" }),
          createMealItem({ name: "おにぎり" }),
        ]}
      />,
    );
    expect(
      screen.getByRole("button", { name: /サラダチキン/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /おにぎり/ }),
    ).toBeInTheDocument();
  });

  it("S-01: a slot with items shows their total calories in its header", () => {
    renderWithDailyMeals(
      <MealSlotCard
        mealType="snack"
        items={[
          createMealItem({ calories: 300 }),
          createMealItem({ calories: 200 }),
        ]}
      />,
    );
    expect(screen.getByText("500 kcal")).toBeInTheDocument();
  });

  it("S-01: a slot with items offers + 追加する and no 前日をコピー", () => {
    renderWithDailyMeals(
      <MealSlotCard mealType="breakfast" items={[createMealItem()]} />,
    );
    expect(
      screen.getByRole("button", { name: /追加する/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /前日をコピー/ }),
    ).not.toBeInTheDocument();
  });

  it("S-01: 登録する opens the register drawer for this slot", async () => {
    const user = userEvent.setup();
    const { store } = renderWithDailyMeals(
      <MealSlotCard mealType="dinner" items={[]} />,
    );

    await user.click(screen.getByRole("button", { name: /登録する/ }));

    expect(store.get(isDrawerOpenAtom)).toBe(true);
    expect(store.get(drawerMealTypeAtom)).toBe("dinner");
  });

  it("S-01: + 追加する opens the register drawer for this slot", async () => {
    const user = userEvent.setup();
    const { store } = renderWithDailyMeals(
      <MealSlotCard mealType="snack" items={[createMealItem()]} />,
    );

    await user.click(screen.getByRole("button", { name: /追加する/ }));

    expect(store.get(isDrawerOpenAtom)).toBe(true);
    expect(store.get(drawerMealTypeAtom)).toBe("snack");
  });

  it("S-02a: tapping an item opens the edit drawer", async () => {
    const user = userEvent.setup();
    renderWithDailyMeals(
      <MealSlotCard
        mealType="lunch"
        items={[createMealItem({ name: "テストアイテム" })]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /テストアイテム/ }));

    expect(
      await screen.findByRole("dialog", { name: "アイテム編集" }),
    ).toBeInTheDocument();
  });

  it("AC-R-5: an item still being saved cannot be opened for editing yet", () => {
    renderWithDailyMeals(
      <MealSlotCard
        mealType="lunch"
        items={[
          { ...createMealItem({ name: "保存中の品" }), isOptimistic: true },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: /保存中の品/ })).toBeDisabled();
  });

  describe("前日をコピー", () => {
    it("QA-1: copies the previous day for the day on screen and this slot", async () => {
      const user = userEvent.setup();
      copyPreviousDayMeal.mockResolvedValue({ ok: true, copiedCount: 2 });
      renderWithDailyMeals(<MealSlotCard mealType="snack" items={[]} />, {
        date: DAY,
        today: "2026-10-20",
      });

      await user.click(screen.getByRole("button", { name: /前日をコピー/ }));

      expect(copyPreviousDayMeal).toHaveBeenCalledWith({
        date: DAY,
        mealType: "snack",
      });
      await waitFor(() =>
        expect(toastSuccess).toHaveBeenCalledWith(
          "前日の間食(2件)をコピーしました",
        ),
      );
    });

    it("QA-1: while copying the button is disabled and says コピー中...", async () => {
      const user = userEvent.setup();
      const pending = deferred<ActionResult<{ copiedCount: number }>>();
      copyPreviousDayMeal.mockReturnValue(pending.promise);
      renderWithDailyMeals(<MealSlotCard mealType="dinner" items={[]} />);

      await user.click(screen.getByRole("button", { name: /前日をコピー/ }));

      expect(screen.getByRole("button", { name: /コピー中/ })).toBeDisabled();
      await act(async () => pending.resolve({ ok: true, copiedCount: 1 }));
      expect(
        screen.getByRole("button", { name: /前日をコピー/ }),
      ).toBeEnabled();
    });

    it("QA-1: when the previous day has nothing in the slot it says so", async () => {
      const user = userEvent.setup();
      copyPreviousDayMeal.mockResolvedValue({ ok: true, copiedCount: 0 });
      renderWithDailyMeals(<MealSlotCard mealType="dinner" items={[]} />);

      await user.click(screen.getByRole("button", { name: /前日をコピー/ }));

      await waitFor(() =>
        expect(toastInfo).toHaveBeenCalledWith("前日の夕食の記録がありません"),
      );
      expect(toastSuccess).not.toHaveBeenCalled();
    });

    it("AC-R-5: when the copy fails an error is shown", async () => {
      const user = userEvent.setup();
      copyPreviousDayMeal.mockResolvedValue({ ok: false });
      renderWithDailyMeals(<MealSlotCard mealType="dinner" items={[]} />);

      await user.click(screen.getByRole("button", { name: /前日をコピー/ }));

      await waitFor(() =>
        expect(toastError).toHaveBeenCalledWith("コピーに失敗しました"),
      );
      expect(toastSuccess).not.toHaveBeenCalled();
    });
  });

  describe("献立に反映", () => {
    it("MI-2: asks first, then adds this slot of the day on screen to the plan", async () => {
      const user = userEvent.setup();
      transferMealToPlan.mockResolvedValue({ ok: true });
      renderWithDailyMeals(
        <MealSlotCard mealType="snack" items={[createMealItem()]} />,
        { date: DAY, today: "2026-10-20" },
      );

      await user.click(screen.getByRole("button", { name: "献立に反映" }));
      expect(
        screen.getByRole("alertdialog", { name: "献立に反映しますか？" }),
      ).toBeInTheDocument();
      expect(transferMealToPlan).not.toHaveBeenCalled();

      await user.click(screen.getByRole("button", { name: "反映する" }));

      expect(transferMealToPlan).toHaveBeenCalledWith({
        date: DAY,
        mealType: "snack",
      });
      await waitFor(() =>
        expect(toastSuccess).toHaveBeenCalledWith("献立に反映しました"),
      );
    });

    it("MI-2: cancelling the question adds nothing", async () => {
      const user = userEvent.setup();
      renderWithDailyMeals(
        <MealSlotCard mealType="snack" items={[createMealItem()]} />,
      );

      await user.click(screen.getByRole("button", { name: "献立に反映" }));
      await user.click(screen.getByRole("button", { name: "キャンセル" }));

      expect(transferMealToPlan).not.toHaveBeenCalled();
    });

    it("AC-R-5: when adding to the plan fails an error is shown", async () => {
      const user = userEvent.setup();
      transferMealToPlan.mockResolvedValue({ ok: false });
      renderWithDailyMeals(
        <MealSlotCard mealType="snack" items={[createMealItem()]} />,
      );

      await user.click(screen.getByRole("button", { name: "献立に反映" }));
      await user.click(screen.getByRole("button", { name: "反映する" }));

      await waitFor(() =>
        expect(toastError).toHaveBeenCalledWith("献立への反映に失敗しました"),
      );
      expect(toastSuccess).not.toHaveBeenCalled();
    });

    it("S-01: an empty slot has nothing to add to the plan", () => {
      renderWithDailyMeals(<MealSlotCard mealType="snack" items={[]} />);
      expect(
        screen.queryByRole("button", { name: "献立に反映" }),
      ).not.toBeInTheDocument();
    });
  });
  describe("the request itself fails (no connection)", () => {
    // AC-R-5 / ui-tech §8: a failure after pressing shows a toast by the slot, not a whole-screen error
    it("AC-R-5: 前日をコピー shows the copy error and the slot stays", async () => {
      const user = userEvent.setup();
      copyPreviousDayMeal.mockRejectedValue(new TypeError("Failed to fetch"));
      renderWithDailyMeals(
        <ScreenErrorBoundary>
          <MealSlotCard mealType="dinner" items={[]} />
        </ScreenErrorBoundary>,
      );

      await user.click(screen.getByRole("button", { name: /前日をコピー/ }));

      await waitFor(() =>
        expect(toastError).toHaveBeenCalledWith("コピーに失敗しました"),
      );
      expect(
        screen.queryByText("エラーが発生しました"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /前日をコピー/ }),
      ).toBeEnabled();
    });

    it("AC-R-5: 献立に反映 shows the plan error and the slot stays", async () => {
      const user = userEvent.setup();
      transferMealToPlan.mockRejectedValue(new TypeError("Failed to fetch"));
      renderWithDailyMeals(
        <ScreenErrorBoundary>
          <MealSlotCard mealType="snack" items={[createMealItem()]} />
        </ScreenErrorBoundary>,
      );

      await user.click(screen.getByRole("button", { name: "献立に反映" }));
      await user.click(screen.getByRole("button", { name: "反映する" }));

      await waitFor(() =>
        expect(toastError).toHaveBeenCalledWith("献立への反映に失敗しました"),
      );
      expect(
        screen.queryByText("エラーが発生しました"),
      ).not.toBeInTheDocument();
    });
  });
});
