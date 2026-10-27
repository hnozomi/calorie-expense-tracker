import { MEAL_TYPES } from "@/types";
import type { DailySummaryRow, DisplayedDailyMeals } from "../types/meal";
import { sumCost, sumNutrition } from "./nutrition-calc";

// The server's summary stays the source of truth; only the difference between the items being saved and the
// confirmed items is added, so the numbers match the server exactly once nothing is pending
/** The day's summary per slot, including changes not yet confirmed by the server */
export const adjustSummaryRows = (
  rows: DailySummaryRow[],
  confirmed: DisplayedDailyMeals,
  displayed: DisplayedDailyMeals,
): DailySummaryRow[] =>
  MEAL_TYPES.map((mealType) => {
    const base = rows.find((row) => row.mealType === mealType);
    const before = sumNutrition(confirmed[mealType]);
    const after = sumNutrition(displayed[mealType]);
    return {
      mealType,
      calories: (base?.calories ?? 0) + after.calories - before.calories,
      protein: (base?.protein ?? 0) + after.protein - before.protein,
      fat: (base?.fat ?? 0) + after.fat - before.fat,
      carbs: (base?.carbs ?? 0) + after.carbs - before.carbs,
      totalCost:
        (base?.totalCost ?? 0) +
        sumCost(displayed[mealType]) -
        sumCost(confirmed[mealType]),
      itemCount:
        (base?.itemCount ?? 0) +
        displayed[mealType].length -
        confirmed[mealType].length,
    };
  });
