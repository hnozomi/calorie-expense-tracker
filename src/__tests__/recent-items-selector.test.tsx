import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecentItemsSelector } from "@/components/features/meals/components/recent-items-selector";
import type { RecentMealItem } from "@/components/features/meals/utils/recent-meal-items";

const mockUseRecentMealItems = vi.fn();
vi.mock("@/components/features/meals/hooks/use-recent-meal-items", () => ({
  useRecentMealItems: () => mockUseRecentMealItems(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const createItem = (
  overrides: Partial<RecentMealItem> = {},
): RecentMealItem => ({
  name: "ヨーグルト",
  calories: 120,
  protein: 8,
  fat: 3,
  carbs: 15,
  cost: 150,
  sourceType: "food_master",
  recipeId: null,
  foodMasterId: "fm-1",
  setMenuId: null,
  ...overrides,
});

describe("RecentItemsSelector", () => {
  it("ローディング中はスケルトンを表示する", () => {
    mockUseRecentMealItems.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    const { container } = render(<RecentItemsSelector onSelect={vi.fn()} />);
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
  });

  it("履歴が空のときは案内メッセージを表示する", () => {
    mockUseRecentMealItems.mockReturnValue({ data: [], isLoading: false });
    render(<RecentItemsSelector onSelect={vi.fn()} />);
    expect(screen.getByText(/まだ記録がありません/)).toBeInTheDocument();
  });

  it("アイテム名とカロリーが表示される", () => {
    mockUseRecentMealItems.mockReturnValue({
      data: [createItem()],
      isLoading: false,
    });
    render(<RecentItemsSelector onSelect={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /ヨーグルト.*120 kcal/ }),
    ).toBeInTheDocument();
  });

  it("タップするとアイテム全体がonSelectに渡される", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const item = createItem();
    mockUseRecentMealItems.mockReturnValue({
      data: [item],
      isLoading: false,
    });
    render(<RecentItemsSelector onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: /ヨーグルト/ }));

    expect(onSelect).toHaveBeenCalledWith(item);
  });
});
