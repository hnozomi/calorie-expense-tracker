import { describe, expect, it } from "vitest";
import {
  hasOcrValues,
  type OcrNutritionResult,
} from "@/components/features/ocr";

/** Create an all-null OCR result with overrides */
const createResult = (
  overrides: Partial<OcrNutritionResult> = {},
): OcrNutritionResult => ({
  name: null,
  calories: null,
  protein: null,
  fat: null,
  carbs: null,
  ...overrides,
});

describe("hasOcrValues", () => {
  it("全フィールドがnullのときはfalseを返す", () => {
    expect(hasOcrValues(createResult())).toBe(false);
  });

  it.each([
    ["name", { name: "サラダチキン" }],
    ["calories", { calories: 100 }],
    ["protein", { protein: 10 }],
    ["fat", { fat: 5 }],
    ["carbs", { carbs: 20 }],
  ] as const)("%s だけ抽出できていればtrueを返す", (_field, overrides) => {
    expect(hasOcrValues(createResult(overrides))).toBe(true);
  });

  it("0はnullではないので抽出値として扱われる", () => {
    expect(hasOcrValues(createResult({ calories: 0 }))).toBe(true);
  });
});
