import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePlanMenuSelectController } from "@/components/features/plan/hooks/use-plan-menu-select-controller";
import type { MealPlan } from "@/components/features/plan/types/meal-plan";

const mockSaveMutateAsync = vi.fn();
vi.mock("@/components/features/plan/hooks/use-save-meal-plan", () => ({
  useSaveMealPlan: () => ({
    mutateAsync: mockSaveMutateAsync,
    isPending: false,
  }),
}));

const mockDeleteMutateAsync = vi.fn();
vi.mock("@/components/features/plan/hooks/use-delete-meal-plan", () => ({
  useDeleteMealPlan: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/components/features/recipes/hooks/use-recipes", () => ({
  useRecipes: () => ({
    data: [
      {
        id: "recipe-1",
        name: "カレー",
        servings: 2,
        calories: 1200,
        protein: 40,
        fat: 30,
        carbs: 160,
        ingredients: [
          {
            id: "i1",
            ingredientName: "ルー",
            quantity: 1,
            unit: "箱",
            unitPrice: 200,
          },
        ],
      },
    ],
  }),
}));

vi.mock("@/components/features/food-masters/hooks/use-food-masters", () => ({
  useFoodMasters: () => ({ data: [] }),
}));

vi.mock("@/components/features/set-menus/hooks/use-set-menus", () => ({
  useSetMenus: () => ({ data: [] }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

afterEach(() => {
  vi.clearAllMocks();
});

const createPlan = (overrides: Partial<MealPlan> = {}): MealPlan => ({
  id: "plan-1",
  userId: "user-1",
  date: "2026-07-01",
  mealType: "dinner",
  plannedName: "既存メニュー",
  recipeId: null,
  foodMasterId: null,
  setMenuId: null,
  calories: 800,
  protein: 20,
  fat: 25,
  carbs: 100,
  estimatedCost: 500,
  isTransferred: false,
  createdAt: "2026-07-01T00:00:00Z",
  ...overrides,
});

const mockOnClose = vi.fn();

const renderController = (existingPlan?: MealPlan) =>
  renderHook(() =>
    usePlanMenuSelectController({
      date: "2026-07-01",
      mealType: "dinner",
      existingPlan,
      onClose: mockOnClose,
    }),
  );

describe("usePlanMenuSelectController", () => {
  it("既存プランがあると手動タブの全フィールド(PFC含む)がプリフィルされる", () => {
    const { result } = renderController(createPlan());

    expect(result.current.manualName).toBe("既存メニュー");
    expect(result.current.manualCalories).toBe("800");
    expect(result.current.manualProtein).toBe("20");
    expect(result.current.manualFat).toBe("25");
    expect(result.current.manualCarbs).toBe("100");
    expect(result.current.manualCost).toBe("500");
  });

  it("メニュー名が空のまま手動保存すると保存は呼ばれない", async () => {
    const { result } = renderController();

    await act(async () => result.current.handleSaveManual());

    expect(mockSaveMutateAsync).not.toHaveBeenCalled();
  });

  it("新規の手動保存は入力値と参照なし(null)で保存される", async () => {
    mockSaveMutateAsync.mockResolvedValue(undefined);
    const { result } = renderController();
    act(() => {
      result.current.setManualName("新メニュー");
      result.current.setManualCalories("600");
      result.current.setManualProtein("15");
    });

    await act(async () => result.current.handleSaveManual());

    await waitFor(() => expect(mockSaveMutateAsync).toHaveBeenCalledTimes(1));
    expect(mockSaveMutateAsync.mock.calls[0][0]).toMatchObject({
      id: undefined,
      values: { plannedName: "新メニュー", calories: 600, protein: 15 },
      recipeId: null,
      foodMasterId: null,
      setMenuId: null,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("レシピ由来の既存プランを手動保存しても参照とPFCが保持される(過去バグH2)", async () => {
    mockSaveMutateAsync.mockResolvedValue(undefined);
    const { result } = renderController(
      createPlan({ recipeId: "recipe-1", protein: 33 }),
    );
    act(() => result.current.setManualName("名前だけ変更"));

    await act(async () => result.current.handleSaveManual());

    await waitFor(() => expect(mockSaveMutateAsync).toHaveBeenCalledTimes(1));
    expect(mockSaveMutateAsync.mock.calls[0][0]).toMatchObject({
      id: "plan-1",
      values: { plannedName: "名前だけ変更", protein: 33 },
      recipeId: "recipe-1",
    });
  });

  it("レシピ選択は1人分に割った値とrecipeIdで保存される", async () => {
    mockSaveMutateAsync.mockResolvedValue(undefined);
    const { result } = renderController();
    const recipe = result.current.recipes?.[0];
    if (!recipe) throw new Error("recipe fixture missing");

    await act(async () => result.current.handleSelectRecipe(recipe));

    await waitFor(() => expect(mockSaveMutateAsync).toHaveBeenCalledTimes(1));
    expect(mockSaveMutateAsync.mock.calls[0][0]).toMatchObject({
      values: {
        plannedName: "カレー",
        calories: 600, // 1200 / 2人分
        protein: 20,
        estimatedCost: 100, // 200 / 2人分
      },
      recipeId: "recipe-1",
    });
  });

  it("削除は既存プランのidで実行され、モーダルが閉じる", async () => {
    mockDeleteMutateAsync.mockResolvedValue(undefined);
    const { result } = renderController(createPlan());

    await act(async () => result.current.handleDelete());

    await waitFor(() =>
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith("plan-1"),
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("保存が失敗したときはモーダルを閉じない", async () => {
    mockSaveMutateAsync.mockRejectedValue(new Error("network"));
    const { result } = renderController();
    act(() => result.current.setManualName("失敗するメニュー"));

    await act(async () => result.current.handleSaveManual());

    await waitFor(() => expect(mockSaveMutateAsync).toHaveBeenCalledTimes(1));
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
