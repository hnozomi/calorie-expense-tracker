import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecipeSelector } from "@/components/features/meals/components/recipe-selector";
import type { Recipe } from "@/components/features/recipes/types/recipe";

afterEach(() => {
  cleanup();
});

const sampleRecipes: Recipe[] = [
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

const searchBox = () => screen.getByPlaceholderText("レシピ名で検索...");

describe("RecipeSelector", () => {
  it("S-02: shows every recipe it receives", () => {
    render(<RecipeSelector recipes={sampleRecipes} onSelect={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /鶏むね肉のサラダ/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /プロテインスムージー/ }),
    ).toBeInTheDocument();
  });

  it("S-02: each recipe shows how many servings it makes", () => {
    render(<RecipeSelector recipes={sampleRecipes} onSelect={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /鶏むね肉のサラダ.*2人分/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /プロテインスムージー.*1人分/ }),
    ).toBeInTheDocument();
  });

  it("S-02: each recipe shows the calories per person", () => {
    render(<RecipeSelector recipes={sampleRecipes} onSelect={vi.fn()} />);
    // 400 kcal / 2 servings and 200 kcal / 1 serving
    expect(
      screen.getByRole("button", { name: /鶏むね肉のサラダ.*200 kcal\/人/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /プロテインスムージー.*200 kcal\/人/,
      }),
    ).toBeInTheDocument();
  });

  it("S-02: an empty list says no recipe is registered", () => {
    render(<RecipeSelector recipes={[]} onSelect={vi.fn()} />);
    expect(screen.getByText("レシピが未登録です")).toBeInTheDocument();
  });

  it("S-02: typing a recipe name narrows the list without reading again", async () => {
    const user = userEvent.setup();
    render(<RecipeSelector recipes={sampleRecipes} onSelect={vi.fn()} />);

    await user.type(searchBox(), "鶏");

    expect(searchBox()).toHaveValue("鶏");
    expect(
      screen.getByRole("button", { name: /鶏むね肉のサラダ/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /プロテインスムージー/ }),
    ).not.toBeInTheDocument();
  });

  it("S-02: a search with no match says nothing matched", async () => {
    const user = userEvent.setup();
    render(<RecipeSelector recipes={sampleRecipes} onSelect={vi.fn()} />);

    await user.type(searchBox(), "カレー");

    expect(screen.getByText("該当するレシピがありません")).toBeInTheDocument();
  });

  it("S-02: tapping a recipe passes the values for one person and its id", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<RecipeSelector recipes={sampleRecipes} onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: /鶏むね肉のサラダ/ }));

    // cost: (200 g × 1.5 + 1 × 150) / 2 servings = 225
    expect(onSelect).toHaveBeenCalledWith(
      {
        name: "鶏むね肉のサラダ",
        calories: 200,
        protein: 25,
        fat: 5,
        carbs: 10,
        cost: 225,
      },
      "r-1",
    );
  });

  it("S-02: a recipe without ingredients costs 0", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<RecipeSelector recipes={sampleRecipes} onSelect={onSelect} />);

    await user.click(
      screen.getByRole("button", { name: /プロテインスムージー/ }),
    );

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ cost: 0 }),
      "r-2",
    );
  });
});
