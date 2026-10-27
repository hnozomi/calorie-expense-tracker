import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import { CandidateListSkeleton } from "@/components/features/meals/components/candidate-list-skeleton";
import { CandidateSelector } from "@/components/features/meals/components/candidate-selector";
import type {
  CandidateTab,
  DrawerCandidates,
} from "@/components/features/meals/types/drawer-candidates";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import type { SetMenu } from "@/components/features/set-menus/types/set-menu";
import { deferred } from "./helpers/daily-meals";

const toastInfo = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: (...args: unknown[]) => toastInfo(...args),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const recipe: Recipe = {
  id: "r-1",
  userId: "user-1",
  name: "親子丼",
  servings: 1,
  calories: 650,
  protein: 30,
  fat: 15,
  carbs: 90,
  notes: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ingredients: [],
};

const foodMaster: FoodMaster = {
  id: "fm-1",
  userId: "user-1",
  name: "納豆",
  brand: null,
  category: null,
  calories: 90,
  protein: 7,
  fat: 4.5,
  carbs: 5,
  defaultPrice: 50,
  notes: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const createSetMenu = (overrides: Partial<SetMenu> = {}): SetMenu => ({
  id: "sm-1",
  userId: "user-1",
  name: "朝の定番",
  totalCalories: 140,
  totalProtein: 12,
  totalFat: 6,
  totalCarbs: 10,
  totalCost: 80,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  items: [
    {
      id: "smi-1",
      setMenuId: "sm-1",
      name: "納豆",
      recipeId: null,
      foodMasterId: "fm-1",
      cost: 50,
      servingQuantity: 1,
      sortOrder: 0,
      calories: 90,
      protein: 7,
      fat: 4.5,
      carbs: 5,
    },
    {
      id: "smi-2",
      setMenuId: "sm-1",
      name: "みそ汁",
      recipeId: null,
      foodMasterId: null,
      cost: 30,
      servingQuantity: 1,
      sortOrder: 1,
      calories: 50,
      protein: 5,
      fat: 1.5,
      carbs: 5,
    },
  ],
  ...overrides,
});

const candidates = (
  overrides: Partial<DrawerCandidates> = {},
): DrawerCandidates => ({
  recentItems: [
    {
      name: "E2Eそば",
      calories: 400,
      protein: 15,
      fat: 3,
      carbs: 70,
      cost: 500,
      sourceType: "manual",
      recipeId: null,
      foodMasterId: null,
      setMenuId: null,
    },
  ],
  recipes: [recipe],
  foodMasters: [foodMaster],
  setMenus: [createSetMenu()],
  hasError: false,
  ...overrides,
});

const renderSelector = (
  tab: CandidateTab,
  candidatesPromise: Promise<DrawerCandidates>,
  handlers: Partial<React.ComponentProps<typeof CandidateSelector>> = {},
) => {
  const props = {
    tab,
    candidates: candidatesPromise,
    onRecentSelect: vi.fn(),
    onRecipeSelect: vi.fn(),
    onFoodMasterSelect: vi.fn(),
    onSetMenuSelect: vi.fn(),
    ...handlers,
  };
  const view = render(
    <Suspense fallback={<CandidateListSkeleton />}>
      <CandidateSelector {...props} />
    </Suspense>,
  );
  return { ...view, props };
};

describe("CandidateSelector", () => {
  it("S-02: while the server is still reading the candidates, the list shows a skeleton", async () => {
    const pending = deferred<DrawerCandidates>();
    const { container } = await act(async () =>
      renderSelector("recipe", pending.promise),
    );

    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
    expect(screen.queryAllByRole("button")).toHaveLength(0);

    await act(async () => pending.resolve(candidates()));
    expect(
      await screen.findByRole("button", { name: /親子丼/ }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      0,
    );
  });

  it.each([
    ["recent", /E2Eそば/],
    ["recipe", /親子丼/],
    ["food_master", /納豆/],
    ["set_menu", /朝の定番/],
  ] as const)("S-02: the %s tab lists the candidates read with the home screen", async (tab, name) => {
    await act(async () => {
      renderSelector(tab, Promise.resolve(candidates()));
    });
    expect(screen.getByRole("button", { name })).toBeInTheDocument();
  });

  it("S-02: when the lists could not be read, it says so and points to the manual tab instead of an empty list", async () => {
    await act(async () => {
      renderSelector(
        "recipe",
        Promise.resolve(
          candidates({
            recentItems: [],
            recipes: [],
            foodMasters: [],
            setMenus: [],
            hasError: true,
          }),
        ),
      );
    });

    expect(
      screen.getByText(
        "一覧を読み込めませんでした。画面を開き直すか、手動タブで入力してください",
      ),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("S-02: switching tabs shows the next list at once from the same candidates", async () => {
    const candidatesPromise = Promise.resolve(candidates());
    const handlers = {
      onRecentSelect: vi.fn(),
      onRecipeSelect: vi.fn(),
      onFoodMasterSelect: vi.fn(),
      onSetMenuSelect: vi.fn(),
    };
    const renderTab = (tab: CandidateTab) => (
      <Suspense fallback={<CandidateListSkeleton />}>
        <CandidateSelector
          tab={tab}
          candidates={candidatesPromise}
          {...handlers}
        />
      </Suspense>
    );
    const { rerender, container } = render(renderTab("recipe"));
    await act(async () => {
      await candidatesPromise;
    });

    rerender(renderTab("food_master"));

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      0,
    );

    expect(screen.getByRole("button", { name: /納豆/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /親子丼/ }),
    ).not.toBeInTheDocument();
  });

  it("S-06: tapping a set menu passes all of its items with the set menu id", async () => {
    const user = userEvent.setup();
    const onSetMenuSelect = vi.fn();
    await act(async () => {
      renderSelector("set_menu", Promise.resolve(candidates()), {
        onSetMenuSelect,
      });
    });

    await user.click(screen.getByRole("button", { name: /朝の定番/ }));

    expect(onSetMenuSelect).toHaveBeenCalledWith([
      expect.objectContaining({
        name: "納豆",
        calories: 90,
        setMenuId: "sm-1",
        foodMasterId: "fm-1",
      }),
      expect.objectContaining({
        name: "みそ汁",
        calories: 50,
        setMenuId: "sm-1",
      }),
    ]);
  });

  it("S-06: a set menu without items adds nothing and says so", async () => {
    const user = userEvent.setup();
    const onSetMenuSelect = vi.fn();
    await act(async () => {
      renderSelector(
        "set_menu",
        Promise.resolve(
          candidates({
            setMenus: [createSetMenu({ name: "空のセット", items: [] })],
          }),
        ),
        { onSetMenuSelect },
      );
    });

    await user.click(screen.getByRole("button", { name: /空のセット/ }));

    expect(onSetMenuSelect).not.toHaveBeenCalled();
    expect(toastInfo).toHaveBeenCalledWith(
      "このセットメニューにはアイテムがありません",
    );
  });

  it("S-06: typing a set menu name narrows the list", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderSelector(
        "set_menu",
        Promise.resolve(
          candidates({
            setMenus: [
              createSetMenu(),
              createSetMenu({ id: "sm-2", name: "夜のセット" }),
            ],
          }),
        ),
      );
    });

    await user.type(
      screen.getByPlaceholderText("セットメニュー名で検索..."),
      "夜",
    );

    expect(
      screen.getByRole("button", { name: /夜のセット/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /朝の定番/ }),
    ).not.toBeInTheDocument();
  });
});
