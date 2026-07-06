import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMealRegisterDrawerController } from "@/components/features/meals/hooks/use-meal-register-drawer-controller";
import type { MealItemFormValues } from "@/components/features/meals/types/meal";

const mockRegisterMutateAsync = vi.fn();
vi.mock("@/components/features/meals/hooks/use-register-meal-items", () => ({
  useRegisterMealItems: () => ({
    mutateAsync: mockRegisterMutateAsync,
    isPending: false,
  }),
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

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

afterEach(() => {
  vi.clearAllMocks();
});

/** Fresh Jotai store per test so atom state never leaks between cases */
const renderController = () =>
  renderHook(() => useMealRegisterDrawerController(), {
    wrapper: ({ children }) => <JotaiProvider>{children}</JotaiProvider>,
  });

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
  it("手動追加で下書きにsourceType=manualのアイテムが積まれる", () => {
    const { result } = renderController();
    act(() => result.current.handleManualAdd(itemValues()));

    expect(result.current.draftItems).toHaveLength(1);
    expect(result.current.draftItems[0]).toMatchObject({
      name: "テスト品",
      sourceType: "manual",
    });
  });

  it("下書きがある状態で閉じると破棄確認が開き、ドロワーは閉じない", () => {
    const { result } = renderController();
    act(() => result.current.handleOpenChange(true));
    act(() => result.current.handleManualAdd(itemValues()));

    act(() => result.current.handleOpenChange(false));

    expect(result.current.isDiscardConfirmOpen).toBe(true);
    expect(result.current.isOpen).toBe(true);
  });

  it("下書きが無くても入力中のフォーム値があれば破棄確認が開く", () => {
    const { result } = renderController();
    act(() => result.current.handleOpenChange(true));
    result.current.manualPendingRef.current = () => itemValues();

    act(() => result.current.handleOpenChange(false));

    expect(result.current.isDiscardConfirmOpen).toBe(true);
    expect(result.current.isOpen).toBe(true);
  });

  it("下書きも入力も無ければそのまま閉じる", () => {
    const { result } = renderController();
    act(() => result.current.handleOpenChange(true));

    act(() => result.current.handleOpenChange(false));

    expect(result.current.isDiscardConfirmOpen).toBe(false);
    expect(result.current.isOpen).toBe(false);
  });

  it("破棄を選ぶとドロワーが閉じて下書きが消える", () => {
    const { result } = renderController();
    act(() => result.current.handleOpenChange(true));
    act(() => result.current.handleManualAdd(itemValues()));

    act(() => result.current.handleDiscardDrafts());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.draftItems).toHaveLength(0);
  });

  it("未追加入力が無ければ登録が実行され、下書きが消えて閉じる", async () => {
    mockRegisterMutateAsync.mockResolvedValue(undefined);
    const { result } = renderController();
    act(() => result.current.handleOpenChange(true));
    act(() => result.current.handleManualAdd(itemValues()));

    await act(async () => result.current.handleRegister());

    await waitFor(() =>
      expect(mockRegisterMutateAsync).toHaveBeenCalledTimes(1),
    );
    expect(mockRegisterMutateAsync.mock.calls[0][0].items).toHaveLength(1);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.draftItems).toHaveLength(0);
  });

  it("未追加入力があると登録せず確認状態(pendingRegisterItems)になる", async () => {
    const { result } = renderController();
    act(() => result.current.handleManualAdd(itemValues()));
    result.current.manualPendingRef.current = () =>
      itemValues({ name: "未追加の品" });

    await act(async () => result.current.handleRegister());

    expect(mockRegisterMutateAsync).not.toHaveBeenCalled();
    expect(result.current.pendingRegisterItems).toHaveLength(1);
    expect(result.current.pendingRegisterItems?.[0].values.name).toBe(
      "未追加の品",
    );
  });

  it("「追加して登録」は下書き+未追加入力をまとめて登録する", async () => {
    mockRegisterMutateAsync.mockResolvedValue(undefined);
    const { result } = renderController();
    act(() => result.current.handleManualAdd(itemValues()));
    result.current.manualPendingRef.current = () =>
      itemValues({ name: "未追加の品" });
    await act(async () => result.current.handleRegister());

    await act(async () => result.current.handleRegisterWithPending());

    await waitFor(() =>
      expect(mockRegisterMutateAsync).toHaveBeenCalledTimes(1),
    );
    const registered = mockRegisterMutateAsync.mock.calls[0][0].items;
    expect(registered).toHaveLength(2);
    expect(registered[1]).toMatchObject({
      name: "未追加の品",
      sourceType: "manual",
    });
  });

  it("「追加せずに登録」は下書きのみ登録する", async () => {
    mockRegisterMutateAsync.mockResolvedValue(undefined);
    const { result } = renderController();
    act(() => result.current.handleManualAdd(itemValues()));
    result.current.manualPendingRef.current = () =>
      itemValues({ name: "未追加の品" });
    await act(async () => result.current.handleRegister());

    await act(async () => result.current.handleRegisterWithoutPending());

    await waitFor(() =>
      expect(mockRegisterMutateAsync).toHaveBeenCalledTimes(1),
    );
    expect(mockRegisterMutateAsync.mock.calls[0][0].items).toHaveLength(1);
    expect(result.current.pendingRegisterItems).toBeNull();
  });

  it("登録失敗時はドロワーが開いたままで下書きも残る", async () => {
    mockRegisterMutateAsync.mockRejectedValue(new Error("network"));
    const { result } = renderController();
    act(() => result.current.handleOpenChange(true));
    act(() => result.current.handleManualAdd(itemValues()));

    await act(async () => result.current.handleRegister());

    await waitFor(() =>
      expect(mockRegisterMutateAsync).toHaveBeenCalledTimes(1),
    );
    expect(result.current.isOpen).toBe(true);
    expect(result.current.draftItems).toHaveLength(1);
  });

  it("食品マスタに保存はスキャン値をクエリパラメータで引き継いで遷移する", () => {
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

  it("OCRが何も抽出できなかったときはエラーメッセージが設定される", async () => {
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
