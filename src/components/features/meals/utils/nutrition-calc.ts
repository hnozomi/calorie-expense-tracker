import type { NutritionValues } from "@/types";

/** Sum up nutrition values from an array of items */
export const sumNutrition = (items: NutritionValues[]): NutritionValues => {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      fat: acc.fat + item.fat,
      carbs: acc.carbs + item.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );
};

/** Sum up cost values from an array of items with optional cost */
export const sumCost = (
  items: { cost: number | null | undefined }[],
): number => {
  return items.reduce((acc, item) => acc + (item.cost ?? 0), 0);
};
