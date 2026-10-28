import type { OcrNutritionResult } from "@/components/features/ocr/types/ocr";

/** Whether the scan read at least one usable field */
export const hasOcrValues = (result: OcrNutritionResult): boolean =>
  result.name !== null ||
  result.calories !== null ||
  result.protein !== null ||
  result.fat !== null ||
  result.carbs !== null;
