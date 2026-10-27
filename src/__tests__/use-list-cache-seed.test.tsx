import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import { getSetMenu } from "@/components/features/set-menus/api/queries";
import { SetMenuFormSection } from "@/components/features/set-menus/components/set-menu-form-section";
import { renderWithQueryClient } from "./helpers/query-client";

// useListCacheSeed opened a set menu's edit screen at once from the list already in the browser (TanStack Query).
// Phase 5 removed it: the edit screen now reads the set menu on the server with the page (AC-R-2), and an id that is
// not there is a 404 (AC-R-7). The same needs (open the right set menu, nothing for an unknown id) are checked on
// SetMenuFormSection and getSetMenu. The DB, the route's 404 and the Server Actions are the boundary here.

class NotFoundError extends Error {}
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new NotFoundError("NEXT_NOT_FOUND");
  },
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));

type QueryResult = { data: unknown; error: unknown };
const setMenuQuery = {
  result: { data: null, error: null } as QueryResult,
  select: vi.fn(() => setMenuQuery),
  eq: vi.fn(() => setMenuQuery),
  is: vi.fn(() => setMenuQuery),
  maybeSingle: vi.fn(async () => setMenuQuery.result),
};
const from = vi.fn((_table: string) => setMenuQuery);
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from }),
}));

const getRecipes = vi.fn();
vi.mock("@/components/features/recipes/api/queries", () => ({
  getRecipes: () => getRecipes(),
  getRecipe: vi.fn(),
}));
const getFoodMasters = vi.fn();
vi.mock("@/components/features/food-masters/api/queries", () => ({
  getFoodMasters: () => getFoodMasters(),
  getFoodMaster: vi.fn(),
}));

vi.mock("@/components/features/set-menus/api/actions", () => ({
  saveSetMenu: vi.fn(),
  deleteSetMenu: vi.fn(),
}));

const SET_MENU_ID = "5c6d7e8f-9a0b-4c1d-8e2f-3a4b5c6d7e8f";

/** A set_menus row with its items, as Supabase returns it */
const setMenuRow = {
  id: SET_MENU_ID,
  user_id: "user-1",
  name: "朝定食セット",
  total_calories: 650,
  total_protein: 35,
  total_fat: 15,
  total_carbs: 80,
  total_cost: 450,
  deleted_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  set_menu_items: [
    {
      id: "item-1",
      set_menu_id: SET_MENU_ID,
      name: "ご飯",
      recipe_id: null,
      food_master_id: "fm-1",
      calories: 250,
      protein: 4,
      fat: 0.5,
      carbs: 55,
      cost: 50,
      serving_quantity: 2,
      sort_order: 0,
    },
  ],
};

const recipe: Recipe = {
  id: "recipe-1",
  userId: "user-1",
  name: "E2E候補の肉じゃが",
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
  id: "fm-2",
  userId: "user-1",
  name: "候補の納豆",
  brand: null,
  category: null,
  calories: 90,
  protein: 8,
  fat: 5,
  carbs: 6,
  defaultPrice: 60,
  notes: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  setMenuQuery.result = { data: null, error: null };
  getRecipes.mockResolvedValue([recipe]);
  getFoodMasters.mockResolvedValue([foodMaster]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const section = (id: string) =>
  SetMenuFormSection({ params: Promise.resolve({ id }) });

describe("SetMenuFormSection (/other/set-menus/[id])", () => {
  it("S-06a: /other/set-menus/new は新規の画面で、セットメニューを DB から読まない", async () => {
    renderWithQueryClient(await section("new"));

    expect(
      screen.getByRole("heading", { name: "セットメニューを登録" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/セットメニュー名/)).toHaveValue("");
    expect(from).not.toHaveBeenCalled();
  });

  it("AC-R-2: 有る id は、サーバーで読んだセットメニューの名前とアイテムを入れた編集の画面で開く", async () => {
    setMenuQuery.result = { data: setMenuRow, error: null };

    renderWithQueryClient(await section(SET_MENU_ID));

    expect(
      screen.getByRole("heading", { name: "セットメニューを編集" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/セットメニュー名/)).toHaveValue(
      "朝定食セット",
    );
    expect(
      screen.getByRole("button", { name: "「ご飯」を外す" }),
    ).toBeInTheDocument();
    // 250 kcal × 2
    expect(screen.getByText(/合計: 500 kcal/)).toBeInTheDocument();
  });

  it("AC-R-2: 追加できるレシピと食品マスタも、サーバーで読んで画面に渡す", async () => {
    renderWithQueryClient(await section("new"));

    expect(getRecipes).toHaveBeenCalledTimes(1);
    expect(getFoodMasters).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: /E2E候補の肉じゃが/ }),
    ).toBeInTheDocument();
  });

  it.each([
    ["数字だけ", "123"],
    ["uuid の形でない文字", "set-1"],
  ])("AC-R-7: uuid でない id(%s)は DB を読まずに 404 にする", async (_, id) => {
    await expect(section(id)).rejects.toBeInstanceOf(NotFoundError);
    expect(from).not.toHaveBeenCalled();
  });

  it("AC-R-7: 無い id・消した id(読んでも見つからない)は 404 にする", async () => {
    setMenuQuery.result = { data: null, error: null };

    await expect(section(SET_MENU_ID)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("getSetMenu (セットメニュー1件の読み取り)", () => {
  it("AC-R-7: id が合い、消していない(deleted_at が無い)セットメニューだけを読み、無ければ null", async () => {
    setMenuQuery.result = { data: null, error: null };

    expect(await getSetMenu(SET_MENU_ID)).toBeNull();
    expect(from).toHaveBeenCalledWith("set_menus");
    expect(setMenuQuery.eq).toHaveBeenCalledWith("id", SET_MENU_ID);
    expect(setMenuQuery.is).toHaveBeenCalledWith("deleted_at", null);
  });
});
