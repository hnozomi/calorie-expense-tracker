import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOcr } from "@/components/features/ocr/hooks/use-ocr";
import type { OcrNutritionResult } from "@/components/features/ocr/types/ocr";

const readNutritionLabel = vi.fn();
vi.mock("@/components/features/ocr/api/actions", () => ({
  readNutritionLabel: (...args: unknown[]) => readNutritionLabel(...args),
}));

const resizeImageToDataUrl = vi.fn();
vi.mock("@/components/features/ocr/utils/resize-image", () => ({
  resizeImageToDataUrl: (...args: unknown[]) => resizeImageToDataUrl(...args),
}));

const RESIZED_DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==";

const labelResult: OcrNutritionResult = {
  name: "サラダチキン",
  calories: 110,
  protein: 23.8,
  fat: 1.2,
  carbs: 0.3,
};

const photo = new File(["photo"], "label.jpg", { type: "image/jpeg" });

beforeEach(() => {
  resizeImageToDataUrl.mockResolvedValue(RESIZED_DATA_URL);
  readNutritionLabel.mockResolvedValue({ ok: true, result: labelResult });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useOcr (F-02 栄養表の読み取り)", () => {
  it("F-02: 撮った写真を縮小してから読み取りに送る", async () => {
    const { result } = renderHook(() => useOcr());

    await act(() => result.current.processImage(photo));

    expect(resizeImageToDataUrl).toHaveBeenCalledWith(photo);
    expect(readNutritionLabel).toHaveBeenCalledWith(RESIZED_DATA_URL);
  });

  it("F-02: 読み取れたら結果を持ち、エラーは出さない", async () => {
    const { result } = renderHook(() => useOcr());

    let returned: OcrNutritionResult | null = null;
    await act(async () => {
      returned = await result.current.processImage(photo);
    });

    expect(returned).toEqual(labelResult);
    expect(result.current.result).toEqual(labelResult);
    expect(result.current.error).toBeNull();
    expect(result.current.isProcessing).toBe(false);
  });

  it("F-02: 読み取りの間は処理中になる", async () => {
    let finish: (value: unknown) => void = () => {};
    readNutritionLabel.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { result } = renderHook(() => useOcr());

    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = result.current.processImage(photo);
    });
    expect(result.current.isProcessing).toBe(true);

    await act(async () => {
      finish({ ok: true, result: labelResult });
      await pending;
    });
    expect(result.current.isProcessing).toBe(false);
  });

  it("F-02: 今日の回数の上限に達したら、上限に達したことを伝える", async () => {
    readNutritionLabel.mockResolvedValue({ ok: false, reason: "limit" });
    const { result } = renderHook(() => useOcr());

    await act(() => result.current.processImage(photo));

    expect(result.current.result).toBeNull();
    expect(result.current.error).toMatch(/上限/);
    expect(result.current.error).not.toMatch(/失敗/);
    expect(result.current.isProcessing).toBe(false);
  });

  it("F-02: 読み取りに失敗したら、失敗したことを伝える", async () => {
    readNutritionLabel.mockResolvedValue({ ok: false, reason: "failed" });
    const { result } = renderHook(() => useOcr());

    await act(() => result.current.processImage(photo));

    expect(result.current.result).toBeNull();
    expect(result.current.error).toMatch(/失敗/);
    expect(result.current.error).not.toMatch(/上限/);
    expect(result.current.isProcessing).toBe(false);
  });

  it("F-02: Server Action の呼び出しが例外を投げたら(オフラインなど)、失敗したことを伝える", async () => {
    readNutritionLabel.mockRejectedValue(new Error("Failed to fetch"));
    const { result } = renderHook(() => useOcr());

    let returned: OcrNutritionResult | null = labelResult;
    await act(async () => {
      returned = await result.current.processImage(photo);
    });

    expect(returned).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.error).toMatch(/失敗/);
    expect(result.current.isProcessing).toBe(false);
  });

  it("F-02: 写真を縮小できなかったら、読み取りに送らず失敗したことを伝える", async () => {
    resizeImageToDataUrl.mockRejectedValue(new Event("error"));
    const { result } = renderHook(() => useOcr());

    await act(() => result.current.processImage(photo));

    expect(readNutritionLabel).not.toHaveBeenCalled();
    expect(result.current.error).toMatch(/失敗/);
  });

  it("F-02: やり直すと結果とエラーが消える", async () => {
    readNutritionLabel.mockResolvedValue({ ok: false, reason: "failed" });
    const { result } = renderHook(() => useOcr());
    await act(() => result.current.processImage(photo));

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.isProcessing).toBe(false);
  });
});
