import {
  act,
  type RenderHookResult,
  renderHook,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePlanMenuSelectController } from "@/components/features/plan/hooks/use-plan-menu-select-controller";
import type { MealPlan } from "@/components/features/plan/types/meal-plan";
import type { PlanCandidates } from "@/components/features/plan/types/plan-candidates";
import {
  candidatesOf,
  createFoodMaster,
  createPlan,
  createRecipe,
  createSetMenu,
  createWeeklyPlansWrapper,
} from "./helpers/weekly-plans";

const saveMealPlan = vi.fn();
const deleteMealPlan = vi.fn();
vi.mock("@/components/features/plan/api/actions", () => ({
  saveMealPlan: (...args: unknown[]) => saveMealPlan(...args),
  deleteMealPlan: (...args: unknown[]) => deleteMealPlan(...args),
  transferPlansToMeals: vi.fn(),
  syncMealsToPlans: vi.fn(),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: vi.fn(),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

const existing = (overrides: Partial<MealPlan> = {}): MealPlan =>
  createPlan({
    id: "plan-1",
    date: "2026-10-21",
    mealType: "dinner",
    plannedName: "既存メニュー",
    calories: 800,
    protein: 20,
    fat: 25,
    carbs: 100,
    estimatedCost: 500,
    ...overrides,
  });

const defaultCandidates = () =>
  candidatesOf({
    recipes: [createRecipe(), createRecipe({ id: "recipe-2", name: "親子丼" })],
    foodMasters: [
      createFoodMaster(),
      createFoodMaster({ id: "fm-2", name: "豆腐", brand: "さとの雪" }),
    ],
    setMenus: [createSetMenu()],
  });

const onClose = vi.fn();
const onReopen = vi.fn();

/** The hook unwraps the candidates with use(), so the first render suspends until they resolve */
const renderController = async (
  existingPlan?: MealPlan,
  candidates: Promise<PlanCandidates> = defaultCandidates(),
) => {
  const { Wrapper } = createWeeklyPlansWrapper({
    weekStart: "2026-10-19",
    today: "2026-10-20",
    plans: existingPlan ? [existingPlan] : [],
    candidates,
  });
  let rendered:
    | RenderHookResult<ReturnType<typeof usePlanMenuSelectController>, unknown>
    | undefined;
  // Inside act, so React takes up the resolved candidates (see renderWithWeeklyPlansSettled)
  await act(async () => {
    rendered = renderHook(
      () =>
        usePlanMenuSelectController({
          date: "2026-10-21",
          mealType: "dinner",
          existingPlan,
          onClose,
          onReopen,
        }),
      { wrapper: Wrapper },
    );
  });
  if (!rendered) throw new Error("render did not run");
  expect(rendered.result.current).not.toBeNull();
  return rendered;
};

/** Let the standalone transition that runs the Server Action finish */
const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe("usePlanMenuSelectController", () => {
  it("P-3: 既存プランがあると手動タブの全フィールド(PFC含む)がプリフィルされる", async () => {
    const { result } = await renderController(existing());

    expect(result.current.manualName).toBe("既存メニュー");
    expect(result.current.manualCalories).toBe("800");
    expect(result.current.manualProtein).toBe("20");
    expect(result.current.manualFat).toBe("25");
    expect(result.current.manualCarbs).toBe("100");
    expect(result.current.manualCost).toBe("500");
  });

  it("メニュー名が空のまま手動保存すると保存は呼ばれない", async () => {
    const { result } = await renderController();

    act(() => result.current.handleSaveManual());
    await flush();

    expect(saveMealPlan).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith("メニュー名を入力してください");
  });

  it("新規の手動保存は入力値と参照なし(null)で保存される", async () => {
    saveMealPlan.mockResolvedValue({ ok: true });
    const { result } = await renderController();
    act(() => {
      result.current.setManualName("新メニュー");
      result.current.setManualCalories("600");
      result.current.setManualProtein("15");
    });

    act(() => result.current.handleSaveManual());

    await waitFor(() => expect(saveMealPlan).toHaveBeenCalledTimes(1));
    expect(saveMealPlan.mock.calls[0][0]).toMatchObject({
      id: undefined,
      date: "2026-10-21",
      mealType: "dinner",
      values: { plannedName: "新メニュー", calories: 600, protein: 15 },
      recipeId: null,
      foodMasterId: null,
      setMenuId: null,
    });
    expect(onClose).toHaveBeenCalled();
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("献立を保存しました"),
    );
    expect(onReopen).not.toHaveBeenCalled();
  });

  it("レシピ由来の既存プランを手動保存しても参照とPFCが保持される(過去バグH2)", async () => {
    saveMealPlan.mockResolvedValue({ ok: true });
    const { result } = await renderController(
      existing({ recipeId: "recipe-curry", protein: 33 }),
    );
    act(() => result.current.setManualName("名前だけ変更"));

    act(() => result.current.handleSaveManual());

    await waitFor(() => expect(saveMealPlan).toHaveBeenCalledTimes(1));
    expect(saveMealPlan.mock.calls[0][0]).toMatchObject({
      id: "plan-1",
      values: { plannedName: "名前だけ変更", protein: 33 },
      recipeId: "recipe-curry",
    });
  });

  it("レシピ選択は1人分に割った値とrecipeIdで保存される", async () => {
    saveMealPlan.mockResolvedValue({ ok: true });
    const { result } = await renderController();
    const recipe = result.current.recipes.find(
      (candidate) => candidate.id === "recipe-curry",
    );
    if (!recipe) throw new Error("recipe fixture missing");

    act(() => result.current.handleSelectRecipe(recipe));

    await waitFor(() => expect(saveMealPlan).toHaveBeenCalledTimes(1));
    expect(saveMealPlan.mock.calls[0][0]).toMatchObject({
      values: {
        plannedName: "カレー",
        calories: 600, // 1200 / 2人分
        protein: 20,
        estimatedCost: 100, // ルー 1箱 × ¥200 / 2人分
      },
      recipeId: "recipe-curry",
      foodMasterId: null,
      setMenuId: null,
    });
  });

  it("削除は既存プランのidで実行され、モーダルが閉じる", async () => {
    deleteMealPlan.mockResolvedValue({ ok: true });
    const { result } = await renderController(existing());

    act(() => result.current.handleDelete());

    await waitFor(() =>
      expect(deleteMealPlan).toHaveBeenCalledWith({ id: "plan-1" }),
    );
    expect(onClose).toHaveBeenCalled();
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("献立を削除しました"),
    );
  });

  // Phase 3 changed this (ui-tech §8 「押した後に失敗」): the dialog closes as soon as save is pressed, and a failure
  // opens it again with what was typed, instead of keeping it open while the save runs
  it("AC-R-5: 保存が失敗したときは、閉じたモーダルを打った値のまま開き直し、品名入りのエラーを出す", async () => {
    saveMealPlan.mockResolvedValue({ ok: false });
    const { result } = await renderController();
    act(() => result.current.setManualName("失敗するメニュー"));

    act(() => result.current.handleSaveManual());

    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onReopen).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith(
      "「失敗するメニュー」の保存に失敗しました",
    );
    expect(result.current.manualName).toBe("失敗するメニュー");
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("AC-R-5: 保存の送信そのものが失敗しても(通信が切れたなど)、エラーページにせず開き直す", async () => {
    saveMealPlan.mockRejectedValue(new TypeError("Failed to fetch"));
    const { result } = await renderController();
    act(() => result.current.setManualName("通信失敗メニュー"));

    act(() => result.current.handleSaveManual());

    await waitFor(() => expect(onReopen).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith(
      "「通信失敗メニュー」の保存に失敗しました",
    );
  });

  it("AC-R-5: 削除が失敗したときは、モーダルを開き直し、品名入りのエラーを出す", async () => {
    deleteMealPlan.mockResolvedValue({ ok: false });
    const { result } = await renderController(existing());

    act(() => result.current.handleDelete());

    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onReopen).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith(
      "「既存メニュー」の削除に失敗しました",
    );
  });

  it("S-07: 新規のセルでは削除しても何も消さない", async () => {
    const { result } = await renderController();

    act(() => result.current.handleDelete());
    await flush();

    expect(deleteMealPlan).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("P-1: 食品マスタ選択はマスタの値・既定の価格とfoodMasterIdで保存される", async () => {
    saveMealPlan.mockResolvedValue({ ok: true });
    const { result } = await renderController();

    act(() => result.current.handleSelectFoodMaster(createFoodMaster()));

    await waitFor(() => expect(saveMealPlan).toHaveBeenCalledTimes(1));
    expect(saveMealPlan.mock.calls[0][0]).toMatchObject({
      values: {
        plannedName: "納豆",
        calories: 90,
        protein: 8,
        fat: 5,
        carbs: 6,
        estimatedCost: 60,
      },
      recipeId: null,
      foodMasterId: "fm-natto",
      setMenuId: null,
    });
  });

  it("P-1: 価格の無い食品マスタは食費0で保存される", async () => {
    saveMealPlan.mockResolvedValue({ ok: true });
    const { result } = await renderController();

    act(() =>
      result.current.handleSelectFoodMaster(
        createFoodMaster({ defaultPrice: null }),
      ),
    );

    await waitFor(() => expect(saveMealPlan).toHaveBeenCalledTimes(1));
    expect(saveMealPlan.mock.calls[0][0]).toMatchObject({
      values: { estimatedCost: 0 },
    });
  });

  it("P-1: セットメニュー選択はセットの合計とsetMenuIdで保存される", async () => {
    saveMealPlan.mockResolvedValue({ ok: true });
    const { result } = await renderController();

    act(() => result.current.handleSelectSetMenu(createSetMenu()));

    await waitFor(() => expect(saveMealPlan).toHaveBeenCalledTimes(1));
    expect(saveMealPlan.mock.calls[0][0]).toMatchObject({
      values: {
        plannedName: "定食セット",
        calories: 750,
        protein: 30,
        fat: 20,
        carbs: 100,
        estimatedCost: 650,
      },
      recipeId: null,
      foodMasterId: null,
      setMenuId: "set-teishoku",
    });
  });

  it("S-07: レシピは名前で、食品マスタは名前とブランドで絞り込める", async () => {
    const { result } = await renderController();

    act(() => {
      result.current.setRecipeSearch("親子");
      result.current.setFmSearch("さとの");
    });

    expect(result.current.recipes.map((recipe) => recipe.name)).toEqual([
      "親子丼",
    ]);
    expect(result.current.foodMasters.map((fm) => fm.name)).toEqual(["豆腐"]);
  });

  it("ui-tech §8: 候補が読めなかったときは、例外にせず一覧の失敗として伝え、手動入力は続けられる", async () => {
    saveMealPlan.mockResolvedValue({ ok: true });
    const { result } = await renderController(
      undefined,
      candidatesOf({ hasError: true }),
    );

    expect(result.current.hasCandidateError).toBe(true);
    expect(result.current.recipes).toEqual([]);

    act(() => result.current.setManualName("手動メニュー"));
    act(() => result.current.handleSaveManual());
    await waitFor(() => expect(saveMealPlan).toHaveBeenCalledTimes(1));
  });

  it("S-07: ダイアログを閉じる操作でonCloseが呼ばれる", async () => {
    const { result } = await renderController();

    act(() => result.current.handleOpenChange(true));
    expect(onClose).not.toHaveBeenCalled();

    act(() => result.current.handleOpenChange(false));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
