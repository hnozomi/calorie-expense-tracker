import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FoodMasterFormSection } from "@/components/features/food-masters/components/food-master-form-section";
import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import { RecipeFormSection } from "@/components/features/recipes/components/recipe-form-section";
import type { Recipe } from "@/components/features/recipes/types/recipe";

// The route's 404 (notFound) and the DB reads are the boundary here
class NotFoundError extends Error {}
const notFound = vi.fn(() => {
  throw new NotFoundError("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({
  notFound: () => notFound(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

const getRecipe = vi.fn();
vi.mock("@/components/features/recipes/api/queries", () => ({
  getRecipe: (...args: unknown[]) => getRecipe(...args),
  getRecipes: vi.fn(),
}));

const getFoodMaster = vi.fn();
vi.mock("@/components/features/food-masters/api/queries", () => ({
  getFoodMaster: (...args: unknown[]) => getFoodMaster(...args),
  getFoodMasters: vi.fn(),
}));

vi.mock("@/components/features/recipes/api/actions", () => ({
  saveRecipe: vi.fn(),
  deleteRecipe: vi.fn(),
}));
vi.mock("@/components/features/food-masters/api/actions", () => ({
  saveFoodMaster: vi.fn(),
  deleteFoodMaster: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const RECIPE_ID = "7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d";
const MASTER_ID = "3f1c2b4a-5d6e-4f70-8a9b-0c1d2e3f4a5b";

const recipe: Recipe = {
  id: RECIPE_ID,
  userId: "user-1",
  name: "肉じゃが",
  servings: 2,
  calories: 800,
  protein: 30,
  fat: 20,
  carbs: 100,
  notes: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ingredients: [],
};

const foodMaster: FoodMaster = {
  id: MASTER_ID,
  userId: "user-1",
  name: "サラダチキン",
  brand: null,
  category: null,
  calories: 110,
  protein: 23.8,
  fat: 1.2,
  carbs: 0.3,
  defaultPrice: null,
  notes: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const recipeSection = (id: string) =>
  RecipeFormSection({ params: Promise.resolve({ id }) });

const foodMasterSection = (
  id: string,
  searchParams: Record<string, string | string[] | undefined> = {},
) =>
  FoodMasterFormSection({
    params: Promise.resolve({ id }),
    searchParams: Promise.resolve(searchParams),
  });

describe("RecipeFormSection (/recipes/[id])", () => {
  it("S-05: /recipes/new は新規の画面で、DB を読まない", async () => {
    render(await recipeSection("new"));

    expect(
      screen.getByRole("heading", { name: "レシピを登録" }),
    ).toBeInTheDocument();
    expect(getRecipe).not.toHaveBeenCalled();
  });

  it("N-2: 有る id はサーバーで読んだレシピを編集の画面に入れて出す", async () => {
    getRecipe.mockResolvedValue(recipe);

    render(await recipeSection(RECIPE_ID));

    expect(getRecipe).toHaveBeenCalledWith(RECIPE_ID);
    expect(
      screen.getByRole("heading", { name: "レシピを編集" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/レシピ名/)).toHaveValue("肉じゃが");
  });

  it.each([
    ["数字だけ", "123"],
    ["uuid の形でない文字", "recipe-1"],
  ])("AC-R-7: uuid でない id(%s)は DB を読まずに 404 にする", async (_, id) => {
    await expect(recipeSection(id)).rejects.toBeInstanceOf(NotFoundError);
    expect(getRecipe).not.toHaveBeenCalled();
  });

  it("AC-R-7: 無い id・消した id(読んでも見つからない)は 404 にする", async () => {
    getRecipe.mockResolvedValue(null);

    await expect(recipeSection(RECIPE_ID)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("FoodMasterFormSection (/other/food-masters/[id])", () => {
  it("S-08a: /other/food-masters/new は新規の画面で、DB を読まない", async () => {
    render(await foodMasterSection("new"));

    expect(
      screen.getByRole("heading", { name: "食品を登録" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/食品名/)).toHaveValue("");
    expect(getFoodMaster).not.toHaveBeenCalled();
  });

  it("S-08a: 新規の URL に付いた OCR の値(?name= など)を入力に入れて出す", async () => {
    render(
      await foodMasterSection("new", {
        name: "プロテインバー",
        calories: "200",
      }),
    );

    expect(screen.getByLabelText(/食品名/)).toHaveValue("プロテインバー");
    expect(screen.getByLabelText(/カロリー/)).toHaveValue(200);
  });

  it("S-08a: 同じ名前が2つ付いた URL(?name=a&name=b)でも新規の画面を出す", async () => {
    render(await foodMasterSection("new", { name: ["a", "b"] }));

    expect(
      screen.getByRole("heading", { name: "食品を登録" }),
    ).toBeInTheDocument();
  });

  it("S-08a: 有る id はサーバーで読んだマスタを編集の画面に入れ、URL の値では上書きしない", async () => {
    getFoodMaster.mockResolvedValue(foodMaster);

    render(await foodMasterSection(MASTER_ID, { name: "別の名前" }));

    expect(getFoodMaster).toHaveBeenCalledWith(MASTER_ID);
    expect(
      screen.getByRole("heading", { name: "食品を編集" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/食品名/)).toHaveValue("サラダチキン");
  });

  it("AC-R-7: uuid でない id は DB を読まずに 404 にする", async () => {
    await expect(foodMasterSection("fm-1")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(getFoodMaster).not.toHaveBeenCalled();
  });

  it("AC-R-7: 無い id・消した id(読んでも見つからない)は 404 にする", async () => {
    getFoodMaster.mockResolvedValue(null);

    await expect(foodMasterSection(MASTER_ID)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
