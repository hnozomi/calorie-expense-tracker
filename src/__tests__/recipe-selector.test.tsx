import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecipeSelector } from "@/components/features/meals/components/recipe-selector";

/** Mock useRecipes hook */
const mockRecipes = [
  {
    id: "r-1",
    userId: "user-1",
    name: "鶏むね肉のサラダ",
    servings: 2,
    calories: 400,
    protein: 50,
    fat: 10,
    carbs: 20,
    notes: null,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ingredients: [
      {
        id: "ing-1",
        recipeId: "r-1",
        ingredientName: "鶏むね肉",
        quantity: 200,
        unit: "g",
        unitPrice: 1.5,
      },
      {
        id: "ing-2",
        recipeId: "r-1",
        ingredientName: "レタス",
        quantity: 1,
        unit: "個",
        unitPrice: 150,
      },
    ],
  },
  {
    id: "r-2",
    userId: "user-1",
    name: "プロテインスムージー",
    servings: 1,
    calories: 200,
    protein: 30,
    fat: 5,
    carbs: 15,
    notes: null,
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ingredients: [],
  },
];

vi.mock("@/components/features/recipes/hooks/use-recipes", () => ({
  useRecipes: () => ({
    data: mockRecipes,
    isLoading: false,
  }),
}));

vi.mock("@/hooks", () => ({
  useDebounce: (value: string) => value,
}));

afterEach(() => {
  cleanup();
});

describe("RecipeSelector", () => {
  it("displays search input", () => {
    render(<RecipeSelector onSelect={vi.fn()} />);
    expect(
      screen.getByPlaceholderText("レシピ名で検索..."),
    ).toBeInTheDocument();
  });

  it("displays recipe list", () => {
    render(<RecipeSelector onSelect={vi.fn()} />);
    expect(screen.getByText("鶏むね肉のサラダ")).toBeInTheDocument();
    expect(screen.getByText("プロテインスムージー")).toBeInTheDocument();
  });

  it("displays servings badge for each recipe", () => {
    render(<RecipeSelector onSelect={vi.fn()} />);
    expect(screen.getByText("2人分")).toBeInTheDocument();
    expect(screen.getByText("1人分")).toBeInTheDocument();
  });

  it("displays per-person calories", () => {
    render(<RecipeSelector onSelect={vi.fn()} />);
    // 400/2 = 200 kcal/人, 200/1 = 200 kcal/人
    const kcalTexts = screen.getAllByText(/200 kcal\/人/);
    expect(kcalTexts.length).toBe(2);
  });

  it("calls onSelect with per-person values when recipe is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<RecipeSelector onSelect={onSelect} />);

    await user.click(screen.getByText("鶏むね肉のサラダ"));

    expect(onSelect).toHaveBeenCalledOnce();
    const called = onSelect.mock.calls[0][0];
    // Per-person: servings=2
    expect(called.name).toBe("鶏むね肉のサラダ");
    expect(called.calories).toBe(200); // 400/2
    expect(called.protein).toBe(25); // 50/2
    expect(called.fat).toBe(5); // 10/2
    expect(called.carbs).toBe(10); // 20/2
    // cost: (200*1.5 + 1*150) / 2 = 225
    expect(called.cost).toBe(225);
  });

  it("calls onSelect with zero cost when recipe has no ingredients", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<RecipeSelector onSelect={onSelect} />);

    await user.click(screen.getByText("プロテインスムージー"));

    expect(onSelect).toHaveBeenCalledOnce();
    const called = onSelect.mock.calls[0][0];
    expect(called.cost).toBe(0);
  });

  it("allows typing in search input", async () => {
    const user = userEvent.setup();
    render(<RecipeSelector onSelect={vi.fn()} />);

    const input = screen.getByPlaceholderText("レシピ名で検索...");
    await user.type(input, "鶏");
    expect(input).toHaveValue("鶏");
  });
});
