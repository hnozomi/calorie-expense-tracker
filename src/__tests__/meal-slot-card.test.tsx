import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MealSlotCard } from "@/components/features/meals/components/meal-slot-card";
import type { MealItem } from "@/components/features/meals/types/meal";

// Mock hooks that depend on Supabase
vi.mock("@/components/features/meals/hooks/use-delete-meal-item", () => ({
  useDeleteMealItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/components/features/meals/hooks/use-update-meal-item", () => ({
  useUpdateMealItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

afterEach(() => {
  cleanup();
});

/** Create a mock MealItem */
const createMealItem = (overrides: Partial<MealItem> = {}): MealItem => ({
  id: crypto.randomUUID(),
  mealId: "meal-1",
  name: "サラダチキン",
  calories: 120,
  protein: 25,
  fat: 2,
  carbs: 1,
  cost: 250,
  sourceType: "manual",
  recipeId: null,
  foodMasterId: null,
  setMenuId: null,
  servingQuantity: 1,
  sortOrder: 0,
  createdAt: "2026-03-21T00:00:00Z",
  updatedAt: "2026-03-21T00:00:00Z",
  ...overrides,
});

const renderWithStore = (ui: React.ReactElement) => {
  const store = createStore();
  return render(<Provider store={store}>{ui}</Provider>);
};

describe("MealSlotCard", () => {
  it("shows meal type label for breakfast", () => {
    renderWithStore(<MealSlotCard mealType="breakfast" items={[]} />);
    expect(screen.getByText("朝食")).toBeInTheDocument();
  });

  it("shows meal type label for lunch", () => {
    renderWithStore(<MealSlotCard mealType="lunch" items={[]} />);
    expect(screen.getByText("昼食")).toBeInTheDocument();
  });

  it("shows meal type label for dinner", () => {
    renderWithStore(<MealSlotCard mealType="dinner" items={[]} />);
    expect(screen.getByText("夕食")).toBeInTheDocument();
  });

  it("shows meal type label for snack", () => {
    renderWithStore(<MealSlotCard mealType="snack" items={[]} />);
    expect(screen.getByText("間食")).toBeInTheDocument();
  });

  it("shows empty state when no items", () => {
    renderWithStore(<MealSlotCard mealType="lunch" items={[]} />);
    expect(screen.getByText("まだ登録されていません")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "登録する" }),
    ).toBeInTheDocument();
  });

  it("displays items with name", () => {
    const items = [
      createMealItem({ name: "サラダチキン" }),
      createMealItem({ name: "おにぎり" }),
    ];
    renderWithStore(<MealSlotCard mealType="dinner" items={items} />);
    expect(screen.getByText("サラダチキン")).toBeInTheDocument();
    expect(screen.getByText("おにぎり")).toBeInTheDocument();
  });

  it("shows total calories in header when items exist", () => {
    const items = [
      createMealItem({ calories: 300 }),
      createMealItem({ calories: 200 }),
    ];
    renderWithStore(<MealSlotCard mealType="snack" items={items} />);
    expect(screen.getByText(/500 kcal/)).toBeInTheDocument();
  });

  it("shows '追加する' button when items exist", () => {
    const items = [createMealItem()];
    renderWithStore(<MealSlotCard mealType="breakfast" items={items} />);
    expect(
      screen.getByRole("button", { name: /追加する/ }),
    ).toBeInTheDocument();
  });

  it("opens edit modal when item is clicked", async () => {
    const user = userEvent.setup();
    const items = [createMealItem({ name: "テストアイテム" })];
    renderWithStore(<MealSlotCard mealType="lunch" items={items} />);

    await user.click(screen.getByText("テストアイテム"));

    expect(screen.getByText("アイテム編集")).toBeInTheDocument();
  });
});
