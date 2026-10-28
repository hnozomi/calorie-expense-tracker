import { describe, expect, it } from "vitest";
import type { OcrNutritionResult } from "@/components/features/ocr/types/ocr";
import {
  ocrNutrition,
  scaleNutrition,
} from "@/components/features/ocr/utils/scale-nutrition";

describe("scaleNutrition (F-02 1個当たりの値を食べた数に掛ける)", () => {
  it("F-02: カロリーと P・F・C に倍率を掛ける", () => {
    expect(
      scaleNutrition({ calories: 50, protein: 2, fat: 3, carbs: 6 }, 8),
    ).toEqual({ calories: 400, protein: 16, fat: 24, carbs: 48 });
  });

  it("F-02: 小数第1位に丸める(0.8 × 3 は 2.4)", () => {
    expect(
      scaleNutrition({ calories: 0.8, protein: 0.8, fat: 0.8, carbs: 0.8 }, 3),
    ).toEqual({ calories: 2.4, protein: 2.4, fat: 2.4, carbs: 2.4 });
  });

  it("F-02: 割り戻し(1 / 個数)も小数第1位に丸める", () => {
    expect(
      scaleNutrition({ calories: 100, protein: 10, fat: 5, carbs: 20 }, 1 / 3),
    ).toEqual({ calories: 33.3, protein: 3.3, fat: 1.7, carbs: 6.7 });
  });

  it("F-02: 栄養以外の項目はそのまま残す", () => {
    expect(
      scaleNutrition(
        {
          name: "餃子",
          cost: 298,
          calories: 40,
          protein: 1.5,
          fat: 2,
          carbs: 4,
        },
        2,
      ),
    ).toEqual({
      name: "餃子",
      cost: 298,
      calories: 80,
      protein: 3,
      fat: 4,
      carbs: 8,
    });
  });
});

describe("ocrNutrition (F-02 読み取った栄養の値)", () => {
  const result: OcrNutritionResult = {
    name: "餃子",
    calories: 40,
    protein: 1.5,
    fat: 2,
    carbs: 4,
    pieceCount: 8,
  };

  it("F-02: 読み取ったカロリーと P・F・C を返す", () => {
    expect(ocrNutrition(result)).toEqual({
      calories: 40,
      protein: 1.5,
      fat: 2,
      carbs: 4,
    });
  });

  it("F-02: 読めなかった(null の)値は 0 にする", () => {
    expect(
      ocrNutrition({
        ...result,
        calories: null,
        protein: null,
        fat: null,
        carbs: null,
      }),
    ).toEqual({ calories: 0, protein: 0, fat: 0, carbs: 0 });
  });
});
