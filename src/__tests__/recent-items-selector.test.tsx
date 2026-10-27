import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecentItemsSelector } from "@/components/features/meals/components/recent-items-selector";
import type { RecentMealItem } from "@/components/features/meals/utils/recent-meal-items";

afterEach(() => {
  cleanup();
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
  it("QA-2: with no history it explains that registered items will show here", () => {
    render(<RecentItemsSelector recentItems={[]} onSelect={vi.fn()} />);
    expect(screen.getByText(/まだ記録がありません/)).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("QA-2: each recent item shows its name and calories", () => {
    render(
      <RecentItemsSelector
        recentItems={[
          createItem(),
          createItem({ name: "カフェラテ", calories: 90 }),
        ]}
        onSelect={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /ヨーグルト.*120 kcal/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /カフェラテ.*90 kcal/ }),
    ).toBeInTheDocument();
  });

  it("QA-2: tapping an item passes the whole item, keeping its source and master link", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const item = createItem();
    render(<RecentItemsSelector recentItems={[item]} onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: /ヨーグルト/ }));

    expect(onSelect).toHaveBeenCalledWith(item);
  });
});
