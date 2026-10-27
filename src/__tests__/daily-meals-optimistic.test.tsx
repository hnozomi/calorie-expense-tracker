import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Component, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MealSlotList } from "@/components/features/meals/components/meal-slot-list";
import { useMealRegisterDrawerController } from "@/components/features/meals/hooks/use-meal-register-drawer-controller";
import { drawerMealTypeAtom } from "@/components/features/meals/stores/meal-register-atom";
import type { ActionResult } from "@/lib/action-result";
import {
  createMealItem,
  deferred,
  emptyDailyMeals,
  renderWithDailyMeals,
} from "./helpers/daily-meals";

/** vaul reads CSS transforms on pointer release, which jsdom does not have; render the drawer as plain markup */
vi.mock("vaul", () => {
  const Passthrough = ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  );
  const Drawer = ({
    children,
    open,
  }: {
    children: ReactNode;
    open?: boolean;
  }) => (open ? <div>{children}</div> : null);
  Drawer.Root = Drawer;
  Drawer.Portal = Passthrough;
  Drawer.Overlay = () => <div />;
  Drawer.Content = Passthrough;
  Drawer.Title = Passthrough;
  Drawer.Description = Passthrough;
  Drawer.Close = Passthrough;
  Drawer.Handle = () => <div />;
  return { Drawer };
});

const registerMealItems = vi.fn();
const updateMealItem = vi.fn();
const deleteMealItem = vi.fn();
vi.mock("@/components/features/meals/api/actions", () => ({
  registerMealItems: (...args: unknown[]) => registerMealItems(...args),
  updateMealItem: (...args: unknown[]) => updateMealItem(...args),
  deleteMealItem: (...args: unknown[]) => deleteMealItem(...args),
  copyPreviousDayMeal: vi.fn(),
  transferMealToPlan: vi.fn(),
}));

vi.mock("@/components/features/ocr", () => ({
  useOcr: () => ({ isProcessing: false, error: null, processImage: vi.fn() }),
  hasOcrValues: () => false,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: (...args: unknown[]) => toastError(...args),
    info: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/** Settle the Server Action and let React end the transition, which drops the optimistic change.
 *  React ends an async transition on a later task, so a microtask flush alone still shows the optimistic state */
const settle = async (
  pending: ReturnType<typeof deferred<ActionResult>>,
  result: ActionResult,
) => {
  await act(async () => {
    pending.resolve(result);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

/** Settle the Server Action with a rejection, as when the phone has no connection and the request never reaches the server */
const failRequest = async (
  pending: ReturnType<typeof deferred<ActionResult>>,
) => {
  await act(async () => {
    pending.reject(new TypeError("Failed to fetch"));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

/** Stands in for src/app/error.tsx: if the failure escapes to it, the whole screen is replaced and the slots are gone */
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

const lunchSlot = () => screen.getByRole("region", { name: "昼食の記録" });

const mealsWithLunch = (...items: ReturnType<typeof createMealItem>[]) => {
  const meals = emptyDailyMeals();
  meals.lunch = { mealId: "meal-lunch", items };
  return meals;
};

/** Stands in for the register drawer: adds one draft and registers it through the real controller */
const RegisterProbe = () => {
  const { handleManualAdd, handleRegister, draftItems } =
    useMealRegisterDrawerController();
  return (
    <>
      <button
        type="button"
        onClick={() =>
          handleManualAdd({
            name: "親子丼",
            calories: 650,
            protein: 30,
            fat: 15,
            carbs: 90,
          })
        }
      >
        下書きに足す
      </button>
      <button
        type="button"
        disabled={draftItems.length === 0}
        onClick={handleRegister}
      >
        登録
      </button>
    </>
  );
};

describe("押した直後の表示(useOptimistic)", () => {
  it("AC-R-5: a registered item shows in its slot before the server answers", async () => {
    const user = userEvent.setup();
    const pending = deferred<ActionResult>();
    registerMealItems.mockReturnValue(pending.promise);
    const { store } = renderWithDailyMeals(
      <>
        <MealSlotList />
        <RegisterProbe />
      </>,
    );
    act(() => store.set(drawerMealTypeAtom, "lunch"));

    await user.click(screen.getByRole("button", { name: "下書きに足す" }));
    await user.click(screen.getByRole("button", { name: "登録" }));

    const slot = lunchSlot();
    expect(
      await within(slot).findByRole("button", { name: /親子丼.*650 kcal/ }),
    ).toBeDisabled();
    // The slot header total and the item row both read 650 kcal
    expect(within(slot).getAllByText("650 kcal")).toHaveLength(2);

    await act(async () => pending.resolve({ ok: true }));
  });

  it("AC-R-5: when registering fails the item leaves the slot again and an error is shown", async () => {
    const user = userEvent.setup();
    const pending = deferred<ActionResult>();
    registerMealItems.mockReturnValue(pending.promise);
    const { store } = renderWithDailyMeals(
      <>
        <MealSlotList />
        <RegisterProbe />
      </>,
    );
    act(() => store.set(drawerMealTypeAtom, "lunch"));
    await user.click(screen.getByRole("button", { name: "下書きに足す" }));
    await user.click(screen.getByRole("button", { name: "登録" }));
    await within(lunchSlot()).findByRole("button", { name: /親子丼/ });

    await settle(pending, { ok: false });

    await waitFor(() =>
      expect(
        within(lunchSlot()).queryByRole("button", { name: /親子丼/ }),
      ).not.toBeInTheDocument(),
    );
    expect(
      within(lunchSlot()).getByRole("button", { name: /登録する/ }),
    ).toBeInTheDocument();
    expect(toastError).toHaveBeenCalledWith(
      "登録に失敗しました。もう一度お試しください",
    );
  });

  it("AC-R-5: an edited item shows its new calories before the server answers", async () => {
    const user = userEvent.setup();
    const pending = deferred<ActionResult>();
    updateMealItem.mockReturnValue(pending.promise);
    renderWithDailyMeals(<MealSlotList />, {
      meals: mealsWithLunch(
        createMealItem({ id: "item-1", name: "E2Eポテチ", calories: 200 }),
      ),
    });

    await user.click(screen.getByRole("button", { name: /E2Eポテチ/ }));
    await user.clear(screen.getByLabelText("カロリー (kcal)"));
    await user.type(screen.getByLabelText("カロリー (kcal)"), "250");
    await user.click(screen.getByRole("button", { name: "変更を保存" }));

    expect(
      await within(lunchSlot()).findByRole("button", {
        name: /E2Eポテチ.*250 kcal/,
      }),
    ).toBeInTheDocument();

    await act(async () => pending.resolve({ ok: true }));
  });

  it("AC-R-5: when the edit fails the item shows its old calories again and an error is shown", async () => {
    const user = userEvent.setup();
    const pending = deferred<ActionResult>();
    updateMealItem.mockReturnValue(pending.promise);
    renderWithDailyMeals(<MealSlotList />, {
      meals: mealsWithLunch(
        createMealItem({ id: "item-1", name: "E2Eポテチ", calories: 200 }),
      ),
    });
    await user.click(screen.getByRole("button", { name: /E2Eポテチ/ }));
    await user.clear(screen.getByLabelText("カロリー (kcal)"));
    await user.type(screen.getByLabelText("カロリー (kcal)"), "250");
    await user.click(screen.getByRole("button", { name: "変更を保存" }));
    await within(lunchSlot()).findByRole("button", { name: /250 kcal/ });

    await settle(pending, { ok: false });

    expect(
      await within(lunchSlot()).findByRole("button", {
        name: /E2Eポテチ.*200 kcal/,
      }),
    ).toBeInTheDocument();
    expect(toastError).toHaveBeenCalledWith(
      "「E2Eポテチ」の更新に失敗しました",
    );
  });

  it("AC-R-5: when the edit fails the edit drawer opens again with the typed values", async () => {
    const user = userEvent.setup();
    const pending = deferred<ActionResult>();
    updateMealItem.mockReturnValue(pending.promise);
    renderWithDailyMeals(<MealSlotList />, {
      meals: mealsWithLunch(
        createMealItem({ id: "item-1", name: "E2Eポテチ", calories: 200 }),
      ),
    });
    await user.click(screen.getByRole("button", { name: /E2Eポテチ/ }));
    await user.clear(screen.getByLabelText("メニュー名"));
    await user.type(screen.getByLabelText("メニュー名"), "E2Eポテチ大袋");
    await user.clear(screen.getByLabelText("カロリー (kcal)"));
    await user.type(screen.getByLabelText("カロリー (kcal)"), "250");
    await user.click(screen.getByRole("button", { name: "変更を保存" }));
    // The drawer closes at once while the change is saved
    await waitFor(() =>
      expect(
        screen.queryByLabelText("カロリー (kcal)"),
      ).not.toBeInTheDocument(),
    );

    await settle(pending, { ok: false });

    expect(await screen.findByLabelText("カロリー (kcal)")).toHaveValue(250);
    expect(screen.getByLabelText("メニュー名")).toHaveValue("E2Eポテチ大袋");
    // The slot itself shows what the server holds, not the typed values
    expect(
      within(lunchSlot()).getByRole("button", { name: /E2Eポテチ.*200 kcal/ }),
    ).toBeInTheDocument();
  });

  it("AC-R-5: a deleted item leaves its slot before the server answers", async () => {
    const user = userEvent.setup();
    const pending = deferred<ActionResult>();
    deleteMealItem.mockReturnValue(pending.promise);
    renderWithDailyMeals(<MealSlotList />, {
      meals: mealsWithLunch(
        createMealItem({ id: "item-1", name: "E2Eポテチ" }),
        createMealItem({ id: "item-2", name: "E2Eおにぎり" }),
      ),
    });

    await user.click(screen.getByRole("button", { name: /E2Eポテチ/ }));
    await user.click(
      screen.getByRole("button", { name: "このアイテムを削除する" }),
    );
    await user.click(screen.getByRole("button", { name: "削除する" }));

    await waitFor(() =>
      expect(
        within(lunchSlot()).queryByRole("button", { name: /E2Eポテチ/ }),
      ).not.toBeInTheDocument(),
    );
    expect(
      within(lunchSlot()).getByRole("button", { name: /E2Eおにぎり/ }),
    ).toBeInTheDocument();

    await act(async () => pending.resolve({ ok: true }));
  });

  it("AC-R-5: when the delete fails the item comes back and an error is shown", async () => {
    const user = userEvent.setup();
    const pending = deferred<ActionResult>();
    deleteMealItem.mockReturnValue(pending.promise);
    renderWithDailyMeals(<MealSlotList />, {
      meals: mealsWithLunch(
        createMealItem({ id: "item-1", name: "E2Eポテチ" }),
      ),
    });
    await user.click(screen.getByRole("button", { name: /E2Eポテチ/ }));
    await user.click(
      screen.getByRole("button", { name: "このアイテムを削除する" }),
    );
    await user.click(screen.getByRole("button", { name: "削除する" }));
    await waitFor(() =>
      expect(
        within(lunchSlot()).queryByRole("button", { name: /E2Eポテチ/ }),
      ).not.toBeInTheDocument(),
    );

    await settle(pending, { ok: false });

    expect(
      await within(lunchSlot()).findByRole("button", { name: /E2Eポテチ/ }),
    ).toBeInTheDocument();
    expect(toastError).toHaveBeenCalledWith(
      "「E2Eポテチ」の削除に失敗しました",
    );
  });

  it("S-01: the slots show the meals the server read for the day", () => {
    renderWithDailyMeals(<MealSlotList />, {
      meals: mealsWithLunch(createMealItem({ name: "E2Eそば", calories: 400 })),
    });
    expect(
      within(lunchSlot()).getByRole("button", { name: /E2Eそば.*400 kcal/ }),
    ).toBeInTheDocument();
    for (const label of ["朝食", "夕食", "間食"]) {
      expect(
        within(
          screen.getByRole("region", { name: `${label}の記録` }),
        ).getByRole("button", { name: /登録する/ }),
      ).toBeInTheDocument();
    }
  });
  describe("the request itself fails (no connection)", () => {
    // AC-R-5 / ui-tech §8: a failure after pressing is undone in place with a toast, not a whole-screen error
    it("AC-R-5: registering: the item leaves the slot again, an error is shown, and the screen stays", async () => {
      const user = userEvent.setup();
      const pending = deferred<ActionResult>();
      registerMealItems.mockReturnValue(pending.promise);
      const { store } = renderWithDailyMeals(
        <ScreenErrorBoundary>
          <MealSlotList />
          <RegisterProbe />
        </ScreenErrorBoundary>,
      );
      act(() => store.set(drawerMealTypeAtom, "lunch"));
      await user.click(screen.getByRole("button", { name: "下書きに足す" }));
      await user.click(screen.getByRole("button", { name: "登録" }));
      await within(lunchSlot()).findByRole("button", { name: /親子丼/ });

      await failRequest(pending);

      expect(
        screen.queryByText("エラーが発生しました"),
      ).not.toBeInTheDocument();
      expect(
        within(lunchSlot()).queryByRole("button", { name: /親子丼/ }),
      ).not.toBeInTheDocument();
      expect(toastError).toHaveBeenCalledWith(
        "登録に失敗しました。もう一度お試しください",
      );
    });

    it("AC-R-5: editing: the item shows its old calories again, an error is shown, and the screen stays", async () => {
      const user = userEvent.setup();
      const pending = deferred<ActionResult>();
      updateMealItem.mockReturnValue(pending.promise);
      renderWithDailyMeals(
        <ScreenErrorBoundary>
          <MealSlotList />
        </ScreenErrorBoundary>,
        {
          meals: mealsWithLunch(
            createMealItem({ id: "item-1", name: "E2Eポテチ", calories: 200 }),
          ),
        },
      );
      await user.click(screen.getByRole("button", { name: /E2Eポテチ/ }));
      await user.clear(screen.getByLabelText("カロリー (kcal)"));
      await user.type(screen.getByLabelText("カロリー (kcal)"), "250");
      await user.click(screen.getByRole("button", { name: "変更を保存" }));
      await within(lunchSlot()).findByRole("button", { name: /250 kcal/ });

      await failRequest(pending);

      expect(
        screen.queryByText("エラーが発生しました"),
      ).not.toBeInTheDocument();
      expect(
        within(lunchSlot()).getByRole("button", {
          name: /E2Eポテチ.*200 kcal/,
        }),
      ).toBeInTheDocument();
      expect(toastError).toHaveBeenCalledWith(
        "「E2Eポテチ」の更新に失敗しました",
      );
    });

    it("AC-R-5: deleting: the item comes back, an error is shown, and the screen stays", async () => {
      const user = userEvent.setup();
      const pending = deferred<ActionResult>();
      deleteMealItem.mockReturnValue(pending.promise);
      renderWithDailyMeals(
        <ScreenErrorBoundary>
          <MealSlotList />
        </ScreenErrorBoundary>,
        {
          meals: mealsWithLunch(
            createMealItem({ id: "item-1", name: "E2Eポテチ" }),
          ),
        },
      );
      await user.click(screen.getByRole("button", { name: /E2Eポテチ/ }));
      await user.click(
        screen.getByRole("button", { name: "このアイテムを削除する" }),
      );
      await user.click(screen.getByRole("button", { name: "削除する" }));

      await failRequest(pending);

      expect(
        screen.queryByText("エラーが発生しました"),
      ).not.toBeInTheDocument();
      expect(
        within(lunchSlot()).getByRole("button", { name: /E2Eポテチ/ }),
      ).toBeInTheDocument();
      expect(toastError).toHaveBeenCalledWith(
        "「E2Eポテチ」の削除に失敗しました",
      );
    });
  });
});
