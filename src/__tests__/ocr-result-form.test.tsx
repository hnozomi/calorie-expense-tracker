import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OcrResultForm } from "@/components/features/ocr/components/ocr-result-form";
import type { OcrNutritionResult } from "@/components/features/ocr/utils/ocr-parser";

afterEach(() => {
  cleanup();
});

const createOcrResult = (
  overrides: Partial<OcrNutritionResult> = {},
): OcrNutritionResult => ({
  name: "サラダチキン",
  calories: 110,
  protein: 23.8,
  fat: 1.2,
  carbs: 0.3,
  ...overrides,
});

describe("OcrResultForm", () => {
  it("displays instruction text", () => {
    render(
      <OcrResultForm
        ocrResult={createOcrResult()}
        onAdd={vi.fn()}
        onSaveToMaster={vi.fn()}
      />,
    );
    expect(
      screen.getByText("OCR結果を確認・修正してください"),
    ).toBeInTheDocument();
  });

  it("pre-fills form with OCR result values", () => {
    render(
      <OcrResultForm
        ocrResult={createOcrResult({
          name: "プロテインバー",
          calories: 200,
        })}
        onAdd={vi.fn()}
        onSaveToMaster={vi.fn()}
      />,
    );

    const nameInput = screen.getByDisplayValue("プロテインバー");
    expect(nameInput).toBeInTheDocument();

    const caloriesInput = screen.getByDisplayValue("200");
    expect(caloriesInput).toBeInTheDocument();
  });

  it("uses empty string for null name", () => {
    render(
      <OcrResultForm
        ocrResult={createOcrResult({ name: null })}
        onAdd={vi.fn()}
        onSaveToMaster={vi.fn()}
      />,
    );

    // Name field should exist with empty value
    const inputs = screen.getAllByRole("textbox");
    const nameInput = inputs[0] as HTMLInputElement;
    expect(nameInput.value).toBe("");
  });

  it("uses 0 for null nutrition values", () => {
    render(
      <OcrResultForm
        ocrResult={createOcrResult({
          calories: null,
          protein: null,
          fat: null,
          carbs: null,
        })}
        onAdd={vi.fn()}
        onSaveToMaster={vi.fn()}
      />,
    );

    const zeroInputs = screen.getAllByDisplayValue("0");
    expect(zeroInputs.length).toBeGreaterThanOrEqual(4);
  });

  it("displays カードに追加 button", () => {
    render(
      <OcrResultForm
        ocrResult={createOcrResult()}
        onAdd={vi.fn()}
        onSaveToMaster={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "カードに追加" }),
    ).toBeInTheDocument();
  });

  it("displays 食品マスタに保存 button", () => {
    render(
      <OcrResultForm
        ocrResult={createOcrResult()}
        onAdd={vi.fn()}
        onSaveToMaster={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "食品マスタに保存" }),
    ).toBeInTheDocument();
  });

  it("calls onSaveToMaster when 食品マスタに保存 is clicked", async () => {
    const user = userEvent.setup();
    const onSaveToMaster = vi.fn();
    render(
      <OcrResultForm
        ocrResult={createOcrResult()}
        onAdd={vi.fn()}
        onSaveToMaster={onSaveToMaster}
      />,
    );

    await user.click(screen.getByRole("button", { name: "食品マスタに保存" }));
    expect(onSaveToMaster).toHaveBeenCalledOnce();
  });

  it("calls onAdd when form is submitted via カードに追加", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(
      <OcrResultForm
        ocrResult={createOcrResult({
          name: "テスト食品",
          calories: 100,
          protein: 10,
          fat: 5,
          carbs: 20,
        })}
        onAdd={onAdd}
        onSaveToMaster={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "カードに追加" }));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledOnce();
    });

    const calledValues = onAdd.mock.calls[0][0];
    expect(calledValues.name).toBe("テスト食品");
    expect(calledValues.calories).toBe(100);
    expect(calledValues.protein).toBe(10);
    expect(calledValues.fat).toBe(5);
    expect(calledValues.carbs).toBe(20);
  });
});
