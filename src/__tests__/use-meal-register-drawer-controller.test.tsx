import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMealRegisterDrawerController } from "@/components/features/meals/hooks/use-meal-register-drawer-controller";
import { drawerMealTypeAtom } from "@/components/features/meals/stores/meal-register-atom";
import type { MealItemFormValues } from "@/components/features/meals/types/meal";
import type { ActionResult } from "@/lib/action-result";
import { createDailyMealsWrapper, deferred } from "./helpers/daily-meals";

const mockRegisterMealItems = vi.fn();
vi.mock("@/components/features/meals/api/actions", () => ({
  registerMealItems: (...args: unknown[]) => mockRegisterMealItems(...args),
  updateMealItem: vi.fn(),
  deleteMealItem: vi.fn(),
  copyPreviousDayMeal: vi.fn(),
  transferMealToPlan: vi.fn(),
}));

const mockProcessImage = vi.fn();
vi.mock("@/components/features/ocr", () => ({
  useOcr: () => ({
    isProcessing: false,
    error: null,
    processImage: mockProcessImage,
  }),
  hasOcrValues: (result: Record<string, unknown>) =>
    Object.values(result).some((value) => value !== null),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockToastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: (...args: unknown[]) => mockToastError(...args),
    info: vi.fn(),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

const DAY = "2026-10-19";

/** Fresh Jotai store per test so atom state never leaks between cases. The home screen shows DAY */
const renderController = () => {
  const { Wrapper, store } = createDailyMealsWrapper({
    date: DAY,
    today: "2026-10-20",
  });
  return {
    ...renderHook(() => useMealRegisterDrawerController(), {
      wrapper: Wrapper,
    }),
    store,
  };
};

const itemValues = (
  overrides: Partial<MealItemFormValues> = {},
): MealItemFormValues => ({
  name: "テスト品",
  calories: 300,
  protein: 10,
  fat: 5,
  carbs: 40,
  ...overrides,
});

describe("useMealRegisterDrawerController", () => {
  it("S-02: 手動追加で下書きにsourceType=manualのアイテムが積まれる", () => {
    const { result } = renderController();
    act(() => result.current.handleManualAdd(itemValues()));

    expect(result.current.draftItems).toHaveLength(1);
    expect(result.current.draftItems[0]).toMatchObject({
      name: "テスト品",
      sourceType: "manual",
    });
  });

  it("QA-2: 履歴からの追加は元のsourceTypeとマスタ参照を保持する", () => {
    const { result } = renderController();
    act(() =>
      result.current.handleRecentAdd({
        name: "ヨーグルト",
        calories: 120,
        protein: 8,
        fat: 3,
        carbs: 15,
        cost: null,
        sourceType: "food_master",
        recipeId: null,
        foodMasterId: "fm-1",
        setMenuId: null,
      }),
    );

    expect(result.current.draftItems[0]).toMatchObject({
      name: "ヨーグルト",
      sourceType: "food_master",
      foodMasterId: "fm-1",
      cost: undefined,
    });
  });

  it("M-3: 下書きがある状態で閉じると破棄確認が開き、ドロワーは閉じない", () => {
    const { result } = renderController();
    act(() => result.current.handleOpenChange(true));
    act(() => result.current.handleManualAdd(itemValues()));

    act(() => result.current.handleOpenChange(false));

    expect(result.current.isDiscardConfirmOpen).toBe(true);
    expect(result.current.isOpen).toBe(true);
  });

  it("M-3: 下書きが無くても入力中のフォーム値があれば破棄確認が開く", () => {
    const { result } = renderController();
    act(() => result.current.handleOpenChange(true));
    result.current.manualPendingRef.current = () => itemValues();

    act(() => result.current.handleOpenChange(false));

    expect(result.current.isDiscardConfirmOpen).toBe(true);
    expect(result.current.isOpen).toBe(true);
  });

  it("M-3: 下書きも入力も無ければそのまま閉じる", () => {
    const { result } = renderController();
    act(() => result.current.handleOpenChange(true));

    act(() => result.current.handleOpenChange(false));

    expect(result.current.isDiscardConfirmOpen).toBe(false);
    expect(result.current.isOpen).toBe(false);
  });

  it("M-3: 破棄を選ぶとドロワーが閉じて下書きが消える", () => {
    const { result } = renderController();
    act(() => result.current.handleOpenChange(true));
    act(() => result.current.handleManualAdd(itemValues()));

    act(() => result.current.handleDiscardDrafts());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.draftItems).toHaveLength(0);
  });

  it("S-02: 未追加入力が無ければ登録が実行され、下書きが消えて閉じる", async () => {
    mockRegisterMealItems.mockResolvedValue({ ok: true });
    const { result } = renderController();
    act(() => result.current.handleOpenChange(true));
    act(() => result.current.handleManualAdd(itemValues()));

    await act(async () => result.current.handleRegister());

    await waitFor(() => expect(mockRegisterMealItems).toHaveBeenCalledTimes(1));
    expect(mockRegisterMealItems.mock.calls[0][0].items).toHaveLength(1);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.draftItems).toHaveLength(0);
  });

  it("M-2: 未追加入力があると登録せず確認状態(pendingRegisterItems)になる", async () => {
    const { result } = renderController();
    act(() => result.current.handleManualAdd(itemValues()));
    result.current.manualPendingRef.current = () =>
      itemValues({ name: "未追加の品" });

    await act(async () => result.current.handleRegister());

    expect(mockRegisterMealItems).not.toHaveBeenCalled();
    expect(result.current.pendingRegisterItems).toHaveLength(1);
    expect(result.current.pendingRegisterItems?.[0].values.name).toBe(
      "未追加の品",
    );
  });

  it("M-2: 「追加して登録」は下書き+未追加入力をまとめて登録する", async () => {
    mockRegisterMealItems.mockResolvedValue({ ok: true });
    const { result } = renderController();
    act(() => result.current.handleManualAdd(itemValues()));
    result.current.manualPendingRef.current = () =>
      itemValues({ name: "未追加の品" });
    await act(async () => result.current.handleRegister());

    await act(async () => result.current.handleRegisterWithPending());

    await waitFor(() => expect(mockRegisterMealItems).toHaveBeenCalledTimes(1));
    const registered = mockRegisterMealItems.mock.calls[0][0].items;
    expect(registered).toHaveLength(2);
    expect(registered[1]).toMatchObject({
      name: "未追加の品",
      sourceType: "manual",
    });
  });

  it("M-2: 「追加せずに登録」は下書きのみ登録する", async () => {
    mockRegisterMealItems.mockResolvedValue({ ok: true });
    const { result } = renderController();
    act(() => result.current.handleManualAdd(itemValues()));
    result.current.manualPendingRef.current = () =>
      itemValues({ name: "未追加の品" });
    await act(async () => result.current.handleRegister());

    await act(async () => result.current.handleRegisterWithoutPending());

    await waitFor(() => expect(mockRegisterMealItems).toHaveBeenCalledTimes(1));
    expect(mockRegisterMealItems.mock.calls[0][0].items).toHaveLength(1);
    expect(result.current.pendingRegisterItems).toBeNull();
  });

  it("AC-R-5: 登録に失敗するとドロワーが下書きを残したまま開き直り、エラーが出る", async () => {
    mockRegisterMealItems.mockResolvedValue({ ok: false });
    const { result } = renderController();
    act(() => result.current.handleOpenChange(true));
    act(() => result.current.handleManualAdd(itemValues()));

    await act(async () => result.current.handleRegister());

    await waitFor(() => expect(mockRegisterMealItems).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.isOpen).toBe(true));
    expect(result.current.draftItems).toHaveLength(1);
    expect(mockToastError).toHaveBeenCalledWith(
      "登録に失敗しました。もう一度お試しください",
    );
  });

  it("AC-R-5: 登録を押すと保存を待たずにドロワーが閉じる", async () => {
    const pending = deferred<ActionResult>();
    mockRegisterMealItems.mockReturnValue(pending.promise);
    const { result } = renderController();
    act(() => result.current.handleOpenChange(true));
    act(() => result.current.handleManualAdd(itemValues()));

    await act(async () => result.current.handleRegister());

    expect(mockRegisterMealItems).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.isRegistering).toBe(true);
    await act(async () => pending.resolve({ ok: true }));
    expect(result.current.isRegistering).toBe(false);
  });

  it("AC-R-3: 画面に出ている日と、ドロワーを開いたスロットに登録する", async () => {
    mockRegisterMealItems.mockResolvedValue({ ok: true });
    const { result, store } = renderController();
    act(() => store.set(drawerMealTypeAtom, "dinner"));
    act(() => result.current.handleManualAdd(itemValues()));

    await act(async () => result.current.handleRegister());

    await waitFor(() =>
      expect(mockRegisterMealItems).toHaveBeenCalledWith({
        date: DAY,
        mealType: "dinner",
        items: [
          expect.objectContaining({ name: "テスト品", sourceType: "manual" }),
        ],
      }),
    );
  });

  it("S-02: 下書きが空なら登録しない", async () => {
    const { result } = renderController();

    await act(async () => result.current.handleRegister());

    expect(mockRegisterMealItems).not.toHaveBeenCalled();
  });

  it("S-03: 食品マスタに保存はスキャン値をクエリパラメータで引き継いで遷移する", () => {
    const { result } = renderController();
    act(() => result.current.handleOpenChange(true));

    act(() =>
      result.current.handleSaveToMaster(
        itemValues({ name: "サラダチキン", calories: 110 }),
      ),
    );

    expect(mockPush).toHaveBeenCalledTimes(1);
    const url = mockPush.mock.calls[0][0] as string;
    expect(url).toContain("/other/food-masters/new?");
    expect(url).toContain(encodeURIComponent("サラダチキン"));
    expect(url).toContain("calories=110");
    expect(result.current.isOpen).toBe(false);
  });

  it("S-03: OCRが何も抽出できなかったときはエラーメッセージが設定される", async () => {
    mockProcessImage.mockResolvedValue({
      name: null,
      calories: null,
      protein: null,
      fat: null,
      carbs: null,
    });
    const { result } = renderController();
    const file = new File(["dummy"], "label.png", { type: "image/png" });
    const event = {
      target: { files: [file], value: "" },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => result.current.handleLibraryFile(event));

    expect(result.current.ocrError).toMatch(/読み取れませんでした/);
    expect(result.current.ocrResult).toBeNull();
  });
});
