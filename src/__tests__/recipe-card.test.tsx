import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecipeCard } from "@/components/features/recipes/components/recipe-card";
import type { Recipe } from "@/components/features/recipes/types/recipe";

afterEach(() => {
  cleanup();
});

/** Create a mock Recipe */
const createRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: "recipe-1",
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
      recipeId: "recipe-1",
      ingredientName: "鶏むね肉",
      quantity: 200,
      unit: "g",
      unitPrice: 1.5,
    },
    {
      id: "ing-2",
      recipeId: "recipe-1",
      ingredientName: "レタス",
      quantity: 1,
      unit: "個",
      unitPrice: 150,
    },
  ],
  ...overrides,
});

describe("RecipeCard", () => {
  it("displays the recipe name", () => {
    render(<RecipeCard recipe={createRecipe()} onClick={vi.fn()} />);
    expect(screen.getByText("鶏むね肉のサラダ")).toBeInTheDocument();
  });

  it("displays servings badge", () => {
    render(<RecipeCard recipe={createRecipe()} onClick={vi.fn()} />);
    expect(screen.getByText("2人分")).toBeInTheDocument();
  });

  it("displays ingredient count", () => {
    render(<RecipeCard recipe={createRecipe()} onClick={vi.fn()} />);
    expect(screen.getByText("材料2品")).toBeInTheDocument();
  });

  it("does not display ingredient count when no ingredients", () => {
    render(
      <RecipeCard
        recipe={createRecipe({ ingredients: [] })}
        onClick={vi.fn()}
      />,
    );
    expect(screen.queryByText(/材料/)).not.toBeInTheDocument();
  });

  it("displays per-person calories", () => {
    render(<RecipeCard recipe={createRecipe()} onClick={vi.fn()} />);
    // 400 kcal / 2 servings = 200 kcal/人
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("kcal/人")).toBeInTheDocument();
  });

  it("displays per-person cost when ingredients have cost", () => {
    render(<RecipeCard recipe={createRecipe()} onClick={vi.fn()} />);
    // (200*1.5 + 1*150) / 2 = 225
    expect(screen.getByText("225/人")).toBeInTheDocument();
    expect(screen.getByText("¥")).toBeInTheDocument();
  });

  it("does not display cost when ingredient cost is zero", () => {
    render(
      <RecipeCard
        recipe={createRecipe({
          ingredients: [
            {
              id: "ing-1",
              recipeId: "recipe-1",
              ingredientName: "水",
              quantity: 500,
              unit: "ml",
              unitPrice: 0,
            },
          ],
        })}
        onClick={vi.fn()}
      />,
    );
    expect(screen.queryByText(/¥/)).not.toBeInTheDocument();
  });

  it("displays per-person PFC values", () => {
    render(<RecipeCard recipe={createRecipe()} onClick={vi.fn()} />);
    // P:50/2=25.0 F:10/2=5.0 C:20/2=10.0
    expect(screen.getByText(/P 25\.0/)).toBeInTheDocument();
    expect(screen.getByText(/F 5\.0/)).toBeInTheDocument();
    expect(screen.getByText(/C 10\.0/)).toBeInTheDocument();
  });

  it("calls onClick when card is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<RecipeCard recipe={createRecipe()} onClick={onClick} />);

    await user.click(screen.getByText("鶏むね肉のサラダ"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("rounds per-person calories to nearest integer", () => {
    render(
      <RecipeCard
        recipe={createRecipe({ calories: 333, servings: 2 })}
        onClick={vi.fn()}
      />,
    );
    // 333/2 = 166.5 → rounds to 167
    expect(screen.getByText("167")).toBeInTheDocument();
  });
});
