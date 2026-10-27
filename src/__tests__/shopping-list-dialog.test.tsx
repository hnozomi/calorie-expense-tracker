import { act, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Activity } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShoppingListButton } from "@/components/features/plan/components/shopping-list-button";
import { ShoppingListDialog } from "@/components/features/plan/components/shopping-list-dialog";
import type { PlanCandidates } from "@/components/features/plan/types/plan-candidates";
import {
  candidatesOf,
  createPlan,
  createRecipe,
  renderWithWeeklyPlansSettled,
  type WeeklyPlansOptions,
} from "./helpers/weekly-plans";

vi.mock("@/components/features/plan/api/actions", () => ({
  saveMealPlan: vi.fn(),
  deleteMealPlan: vi.fn(),
  transferPlansToMeals: vi.fn(),
  syncMealsToPlans: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// 2人分のカレー: じゃがいも 6個 (単価 ¥300)、豚肉 900g (単価 ¥1350)
const curry = createRecipe({
  id: "recipe-curry",
  name: "カレー",
  servings: 2,
  ingredients: [
    {
      id: "ing-potato",
      recipeId: "recipe-curry",
      ingredientName: "じゃがいも",
      quantity: 6,
      unit: "個",
      unitPrice: 300,
    },
    {
      id: "ing-pork",
      recipeId: "recipe-curry",
      ingredientName: "豚肉",
      quantity: 900,
      unit: "g",
      unitPrice: 1350,
    },
  ],
});

/** Two plans of the 2-serving curry make one whole recipe */
const twoCurryPlans = () => [
  createPlan({ recipeId: "recipe-curry", plannedName: "カレー" }),
  createPlan({
    date: "2026-10-20",
    recipeId: "recipe-curry",
    plannedName: "カレー",
  }),
];

const renderDialog = (options: WeeklyPlansOptions = {}) =>
  renderWithWeeklyPlansSettled(
    <ShoppingListDialog isOpen onOpenChange={vi.fn()} />,
    options,
  );

describe("ShoppingListDialog", () => {
  it("S-07: レシピ由来の献立が無い週は空状態メッセージを表示する", async () => {
    await renderDialog({
      plans: [createPlan({ plannedName: "手動メニュー" })],
      candidates: candidatesOf({ recipes: [curry] }),
    });
    expect(
      screen.getByText("この週にレシピ由来の献立がありません"),
    ).toBeInTheDocument();
  });

  it("S-07: 材料名・数量・単位・概算金額・合計が表示される", async () => {
    await renderDialog({
      plans: twoCurryPlans(),
      candidates: candidatesOf({ recipes: [curry] }),
    });

    expect(screen.getByText("じゃがいも")).toBeInTheDocument();
    expect(screen.getByText("6個")).toBeInTheDocument();
    expect(screen.getByText("¥300")).toBeInTheDocument();
    expect(screen.getByText("豚肉")).toBeInTheDocument();
    expect(screen.getByText("900g")).toBeInTheDocument();
    expect(screen.getByText("¥1,350")).toBeInTheDocument();
    expect(screen.getByText("概算合計(2品)")).toBeInTheDocument();
    expect(screen.getByText("¥1,650")).toBeInTheDocument();
  });

  it("チェックすると取り消し線が付き、外すと戻る", async () => {
    const user = userEvent.setup();
    await renderDialog({
      plans: twoCurryPlans(),
      candidates: candidatesOf({ recipes: [curry] }),
    });

    const checkbox = screen.getByRole("checkbox", { name: /じゃがいも/ });
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByText("じゃがいも")).toHaveClass("line-through");

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText("じゃがいも")).not.toHaveClass("line-through");
  });

  it("S-07: ローディング中はスケルトンを表示する", async () => {
    // The recipes are still being read on the server
    const reading = new Promise<PlanCandidates>(() => {});
    const { baseElement } = await renderDialog({
      plans: twoCurryPlans(),
      candidates: reading,
    });
    expect(
      baseElement.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("じゃがいも")).not.toBeInTheDocument();
  });

  it("ui-tech §8: レシピが読めなかったときは、例外にせずダイアログの中で伝える", async () => {
    await renderDialog({
      plans: twoCurryPlans(),
      candidates: candidatesOf({ hasError: true }),
    });
    expect(
      screen.getByText(/レシピを読み込めませんでした/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("この週にレシピ由来の献立がありません"),
    ).not.toBeInTheDocument();
  });

  it("ui-tech §10 フェーズ3: 開いたときに読み直さず、画面の週の献立から作る(1人分の献立は材料の半分)", async () => {
    await renderDialog({
      plans: [createPlan({ recipeId: "recipe-curry", plannedName: "カレー" })],
      candidates: candidatesOf({ recipes: [curry] }),
    });
    expect(screen.getByText("3個")).toBeInTheDocument();
    expect(screen.getByText("450g")).toBeInTheDocument();
  });
});

/** The dialog body is the first to use() the candidates here; React only takes up the resolved promise when it is flushed inside act */
const openShoppingList = async (user: ReturnType<typeof userEvent.setup>) => {
  await act(async () => {
    await user.click(screen.getByRole("button", { name: "買い物リスト" }));
  });
};

describe("ShoppingListButton", () => {
  it("S-07: 「買い物リスト」を押すとダイアログが開き、閉じて開き直すとチェックは外れている", async () => {
    const user = userEvent.setup();
    await renderWithWeeklyPlansSettled(<ShoppingListButton />, {
      plans: twoCurryPlans(),
      candidates: candidatesOf({ recipes: [curry] }),
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await openShoppingList(user);
    const dialog = screen.getByRole("dialog", { name: "買い物リスト" });
    await user.click(screen.getByRole("checkbox", { name: /じゃがいも/ }));
    expect(dialog).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await openShoppingList(user);
    expect(
      screen.getByRole("checkbox", { name: /じゃがいも/ }),
    ).not.toBeChecked();
  });

  // With cacheComponents the plan screen stays mounted but hidden (<Activity mode="hidden">) after moving to another tab
  it("ui-tech §4: タブを移って献立の画面が隠れるとダイアログが閉じ、戻ったときに開いて見えない", async () => {
    const user = userEvent.setup();
    const onScreen = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <ShoppingListButton />
      </Activity>
    );
    const { rerender } = await renderWithWeeklyPlansSettled(
      onScreen("visible"),
      {
        plans: twoCurryPlans(),
        candidates: candidatesOf({ recipes: [curry] }),
      },
    );
    await openShoppingList(user);
    expect(
      screen.getByRole("dialog", { name: "買い物リスト" }),
    ).toBeInTheDocument();

    await act(async () => {
      rerender(onScreen("hidden"));
    });
    await act(async () => {
      rerender(onScreen("visible"));
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "買い物リスト" }),
    ).toBeInTheDocument();
  });
});
