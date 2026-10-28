import type { OcrNutritionResult } from "@/components/features/ocr/types/ocr";

type Nutrition = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

// One decimal place, so 0.8 × 3 shows as 2.4 rather than 2.4000000000000004
const roundToTenth = (value: number): number => Math.round(value * 10) / 10;

/** Multiply each nutrition value by factor (a piece count, or 1 / count to get one piece back) */
export const scaleNutrition = <T extends Nutrition>(
  values: T,
  factor: number,
): T => ({
  ...values,
  calories: roundToTenth(values.calories * factor),
  protein: roundToTenth(values.protein * factor),
  fat: roundToTenth(values.fat * factor),
  carbs: roundToTenth(values.carbs * factor),
});

/** The scanned values with unread fields as 0, for one piece or for the whole label */
export const ocrNutrition = (result: OcrNutritionResult): Nutrition => ({
  calories: result.calories ?? 0,
  protein: result.protein ?? 0,
  fat: result.fat ?? 0,
  carbs: result.carbs ?? 0,
});
