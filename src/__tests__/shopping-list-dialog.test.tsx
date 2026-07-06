import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShoppingListDialog } from "@/components/features/plan/components/shopping-list-dialog";
import type { ShoppingListEntry } from "@/components/features/plan/utils/shopping-list";

const mockUseShoppingList = vi.fn();
vi.mock("@/components/features/plan/hooks/use-shopping-list", () => ({
  useShoppingList: (weekStart: string) => mockUseShoppingList(weekStart),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const createEntry = (
  overrides: Partial<ShoppingListEntry> = {},
): ShoppingListEntry => ({
  key: "じゃがいも|個",
  ingredientName: "じゃがいも",
  unit: "個",
  totalQuantity: 6,
  estimatedCost: 300,
  ...overrides,
});

const renderDialog = () =>
  render(
    <ShoppingListDialog
      weekStart="2026-07-06"
      isOpen={true}
      onClose={vi.fn()}
    />,
  );

describe("ShoppingListDialog", () => {
  it("レシピ由来の献立が無い週は空状態メッセージを表示する", () => {
    mockUseShoppingList.mockReturnValue({
      entries: [],
      totalCost: 0,
      hasRecipePlans: false,
      isLoading: false,
    });
    renderDialog();
    expect(
      screen.getByText("この週にレシピ由来の献立がありません"),
    ).toBeInTheDocument();
  });

  it("材料名・数量・単位・概算金額・合計が表示される", () => {
    mockUseShoppingList.mockReturnValue({
      entries: [
        createEntry(),
        createEntry({
          key: "豚肉|g",
          ingredientName: "豚肉",
          unit: "g",
          totalQuantity: 450,
          estimatedCost: 675,
        }),
      ],
      totalCost: 975,
      hasRecipePlans: true,
      isLoading: false,
    });
    renderDialog();

    expect(screen.getByText("じゃがいも")).toBeInTheDocument();
    expect(screen.getByText("6個")).toBeInTheDocument();
    expect(screen.getByText("450g")).toBeInTheDocument();
    expect(screen.getByText("¥675")).toBeInTheDocument();
    expect(screen.getByText("概算合計(2品)")).toBeInTheDocument();
    expect(screen.getByText("¥975")).toBeInTheDocument();
  });

  it("チェックすると取り消し線が付き、外すと戻る", async () => {
    const user = userEvent.setup();
    mockUseShoppingList.mockReturnValue({
      entries: [createEntry()],
      totalCost: 300,
      hasRecipePlans: true,
      isLoading: false,
    });
    renderDialog();

    const checkbox = screen.getByRole("checkbox", { name: /じゃがいも/ });
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByText("じゃがいも")).toHaveClass("line-through");

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText("じゃがいも")).not.toHaveClass("line-through");
  });

  it("ローディング中はスケルトンを表示する", () => {
    mockUseShoppingList.mockReturnValue({
      entries: [],
      totalCost: 0,
      hasRecipePlans: false,
      isLoading: true,
    });
    const { baseElement } = renderDialog();
    expect(
      baseElement.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
  });
});
