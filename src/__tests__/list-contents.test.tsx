import { cleanup, render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FoodMasterListContent } from "@/components/features/food-masters/components/food-master-list-content";
import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import { RecipeListContent } from "@/components/features/recipes/components/recipe-list-content";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import { SetMenuListContent } from "@/components/features/set-menus/components/set-menu-list-content";
import { SetMenuListSection } from "@/components/features/set-menus/components/set-menu-list-section";
import type { SetMenu } from "@/components/features/set-menus/types/set-menu";

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

// next/link is the framework boundary: record whether each link asks to be prefetched
vi.mock("next/link", () => ({
  default: ({
    href,
    prefetch,
    children,
    ...props
  }: {
    href: string;
    prefetch?: boolean | null;
    children: ReactNode;
  }) => (
    <a href={href} data-prefetch={String(prefetch)} {...props}>
      {children}
    </a>
  ),
}));

const getSetMenus = vi.fn();
vi.mock("@/components/features/set-menus/api/queries", () => ({
  getSetMenus: () => getSetMenus(),
  getSetMenu: vi.fn(),
}));

// The search box writes ?q= with the router
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/other/set-menus",
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const createRecipe = (id: string, name: string): Recipe => ({
  id,
  userId: "user-1",
  name,
  servings: 1,
  calories: 500,
  protein: 20,
  fat: 10,
  carbs: 60,
  notes: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ingredients: [],
});

const createFoodMaster = (
  id: string,
  name: string,
  brand: string | null,
): FoodMaster => ({
  id,
  userId: "user-1",
  name,
  brand,
  category: null,
  calories: 100,
  protein: 10,
  fat: 1,
  carbs: 1,
  defaultPrice: null,
  notes: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});

const RECIPES = [
  createRecipe("r1", "鶏むね肉のサラダ"),
  createRecipe("r2", "ビーフカレー"),
];

const FOOD_MASTERS = [
  createFoodMaster("f1", "サラダチキン", "セブンイレブン"),
  createFoodMaster("f2", "ゆで卵", "ローソン"),
  createFoodMaster("f3", "納豆", null),
];

describe("RecipeListContent (S-04 レシピ一覧)", () => {
  it("S-04: 検索語が無ければ全部のレシピを、詳細へのリンクとして出す", async () => {
    getRecipes.mockResolvedValue(RECIPES);

    render(await RecipeListContent({ query: "" }));

    expect(
      screen.getByRole("link", { name: /鶏むね肉のサラダ/ }),
    ).toHaveAttribute("href", "/recipes/r1");
    expect(screen.getByRole("link", { name: /ビーフカレー/ })).toHaveAttribute(
      "href",
      "/recipes/r2",
    );
  });

  it("AC-R-3: 検索語(?q=)に名前が合うレシピだけを出す", async () => {
    getRecipes.mockResolvedValue(RECIPES);

    render(await RecipeListContent({ query: "カレー" }));

    expect(
      screen.getByRole("link", { name: /ビーフカレー/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /鶏むね肉のサラダ/ }),
    ).not.toBeInTheDocument();
  });

  it("ui-tech フェーズ4: 一覧の行のリンクは先読み(prefetch)を付けない", async () => {
    getRecipes.mockResolvedValue(RECIPES);

    render(await RecipeListContent({ query: "" }));

    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("data-prefetch", "true");
    }
  });

  it("02 空状態: レシピが1件も無ければ、その旨と最初の1件を登録するボタンを出す", async () => {
    getRecipes.mockResolvedValue([]);

    render(await RecipeListContent({ query: "" }));

    expect(
      screen.getByText("レシピがまだ登録されていません"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /最初のレシピを登録する/ }),
    ).toHaveAttribute("href", "/recipes/new");
  });

  it("02 空状態: 検索に合うレシピが無ければ、見つからないことを出し、登録のボタンは出さない", async () => {
    getRecipes.mockResolvedValue(RECIPES);

    render(await RecipeListContent({ query: "ラーメン" }));

    expect(
      screen.getByText("該当するレシピが見つかりません"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("FoodMasterListContent (S-08 食品マスタ一覧)", () => {
  it("S-08: 検索語が無ければ全部のマスタを、詳細へのリンクとして出す", async () => {
    getFoodMasters.mockResolvedValue(FOOD_MASTERS);

    render(await FoodMasterListContent({ query: "" }));

    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.getByRole("link", { name: /ゆで卵/ })).toHaveAttribute(
      "href",
      "/other/food-masters/f2",
    );
  });

  it("S-08: 食品名で検索できる", async () => {
    getFoodMasters.mockResolvedValue(FOOD_MASTERS);

    render(await FoodMasterListContent({ query: "納豆" }));

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /納豆/ })).toBeInTheDocument();
  });

  it("S-08: ブランド名でも検索できる", async () => {
    getFoodMasters.mockResolvedValue(FOOD_MASTERS);

    render(await FoodMasterListContent({ query: "ローソン" }));

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /ゆで卵/ })).toBeInTheDocument();
  });

  it("ui-tech フェーズ4: 一覧の行のリンクは先読み(prefetch)を付けない", async () => {
    getFoodMasters.mockResolvedValue(FOOD_MASTERS);

    render(await FoodMasterListContent({ query: "" }));

    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("data-prefetch", "true");
    }
  });

  it("02 空状態: マスタが1件も無ければ、その旨と最初の1件を登録するボタンを出す", async () => {
    getFoodMasters.mockResolvedValue([]);

    render(await FoodMasterListContent({ query: "" }));

    expect(
      screen.getByText("食品マスタがまだ登録されていません"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /最初の食品を登録する/ }),
    ).toHaveAttribute("href", "/other/food-masters/new");
  });

  it("02 空状態: 検索に合うマスタが無ければ、見つからないことを出し、登録のボタンは出さない", async () => {
    getFoodMasters.mockResolvedValue(FOOD_MASTERS);

    render(await FoodMasterListContent({ query: "ラーメン" }));

    expect(
      screen.getByText("該当する食品が見つかりません"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

const createSetMenu = (
  id: string,
  name: string,
  itemNames: string[] = [],
): SetMenu => ({
  id,
  userId: "user-1",
  name,
  totalCalories: 650,
  totalProtein: 30,
  totalFat: 15,
  totalCarbs: 80,
  totalCost: 450,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  items: itemNames.map((itemName, index) => ({
    id: `${id}-item-${index}`,
    setMenuId: id,
    name: itemName,
    recipeId: null,
    foodMasterId: "fm-1",
    calories: 100,
    protein: 5,
    fat: 2,
    carbs: 10,
    cost: 50,
    servingQuantity: 1,
    sortOrder: index,
  })),
});

const SET_MENUS = [
  createSetMenu("s1", "朝定食セット", ["ご飯", "味噌汁"]),
  createSetMenu("s2", "昼のカレーセット", ["カレー"]),
];

describe("SetMenuListContent (S-06 セットメニュー一覧)", () => {
  it("S-06: 検索語が無ければ全部のセットメニューを、編集画面へのリンクとして出す", async () => {
    getSetMenus.mockResolvedValue(SET_MENUS);

    render(await SetMenuListContent({ query: "" }));

    expect(screen.getByRole("link", { name: /朝定食セット/ })).toHaveAttribute(
      "href",
      "/other/set-menus/s1",
    );
    expect(
      screen.getByRole("link", { name: /昼のカレーセット/ }),
    ).toHaveAttribute("href", "/other/set-menus/s2");
  });

  it("S-06: カードに、セットのアイテムの名前を出す", async () => {
    getSetMenus.mockResolvedValue(SET_MENUS);

    render(await SetMenuListContent({ query: "" }));

    const card = screen.getByRole("link", { name: /朝定食セット/ });
    expect(card).toHaveTextContent("ご飯");
    expect(card).toHaveTextContent("味噌汁");
  });

  it("AC-R-3: 検索語(?q=)に名前が合うセットメニューだけを出す", async () => {
    getSetMenus.mockResolvedValue(SET_MENUS);

    render(await SetMenuListContent({ query: "カレー" }));

    expect(
      screen.getByRole("link", { name: /昼のカレーセット/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /朝定食セット/ }),
    ).not.toBeInTheDocument();
  });

  it("ui-tech フェーズ4: 一覧の行のリンクは先読み(prefetch)を付けない", async () => {
    getSetMenus.mockResolvedValue(SET_MENUS);

    render(await SetMenuListContent({ query: "" }));

    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("data-prefetch", "true");
    }
  });

  it("02 空状態: セットメニューが1件も無ければ、その旨と最初の1件を登録するボタンを出す", async () => {
    getSetMenus.mockResolvedValue([]);

    render(await SetMenuListContent({ query: "" }));

    expect(
      screen.getByText("セットメニューがまだ登録されていません"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /最初のセットメニューを登録する/ }),
    ).toHaveAttribute("href", "/other/set-menus/new");
  });

  it("02 空状態: 検索に合うセットメニューが無ければ、見つからないことを出し、登録のボタンは出さない", async () => {
    getSetMenus.mockResolvedValue(SET_MENUS);

    render(await SetMenuListContent({ query: "ラーメン" }));

    expect(
      screen.getByText("該当するセットメニューが見つかりません"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("SetMenuListSection (/other/set-menus?q=)", () => {
  it("AC-R-3: ?q= の検索語(前後の空白を除く)を検索欄に入れ、その語で一覧を絞り、検索語ごとに一覧を読み直す(Suspense の key)", async () => {
    const section = (await SetMenuListSection({
      searchParams: Promise.resolve({ q: "  カレー " }),
    })) as ReactElement<{ children: ReactElement[] }>;
    const [searchBox, results] = section.props.children as [
      ReactElement,
      ReactElement<{ children: ReactElement<{ query: string }> }>,
    ];

    render(searchBox);

    expect(
      screen.getByRole("searchbox", { name: "セットメニュー名で検索..." }),
    ).toHaveValue("カレー");
    expect(results.key).toBe("カレー");
    expect(results.props.children.props.query).toBe("カレー");
  });
});
