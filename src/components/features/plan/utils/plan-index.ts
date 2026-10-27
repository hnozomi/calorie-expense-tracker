import type { DisplayedMealPlan } from "@/components/features/plan/types/meal-plan";

export type DailyTotals = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  cost: number;
};

export const EMPTY_TOTALS: DailyTotals = {
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  cost: 0,
};

/** Plans per cell (date:mealType) and totals per day, built in one pass */
export const buildPlanIndex = (plans: DisplayedMealPlan[]) => {
  const plansBySlot = new Map<string, DisplayedMealPlan[]>();
  const totalsByDate = new Map<string, DailyTotals>();

  for (const plan of plans) {
    const slotKey = `${plan.date}:${plan.mealType}`;
    const existingSlotPlans = plansBySlot.get(slotKey);
    if (existingSlotPlans) {
      existingSlotPlans.push(plan);
    } else {
      plansBySlot.set(slotKey, [plan]);
    }

    const currentTotals = totalsByDate.get(plan.date) ?? EMPTY_TOTALS;
    totalsByDate.set(plan.date, {
      calories: currentTotals.calories + plan.calories,
      protein: currentTotals.protein + plan.protein,
      fat: currentTotals.fat + plan.fat,
      carbs: currentTotals.carbs + plan.carbs,
      cost: currentTotals.cost + plan.estimatedCost,
    });
  }

  return { plansBySlot, totalsByDate };
};

export type DayCalorieRating = {
  isOver: boolean;
  /** Planned but under 80% of the target */
  isLow: boolean;
  /** 0..1 against the largest day of the week, for the bar */
  intensity: number;
};

export const rateDayCalories = (
  calories: number,
  targetCalories: number,
  maxCalories: number,
): DayCalorieRating => {
  const hasTarget = targetCalories > 0;
  return {
    isOver: hasTarget && calories > targetCalories,
    isLow: hasTarget && calories > 0 && calories < targetCalories * 0.8,
    intensity: maxCalories > 0 ? calories / maxCalories : 0,
  };
};
