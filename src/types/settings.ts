/** User nutrition target settings */
export type NutritionTarget = {
  id: string;
  userId: string;
  targetCalories: number;
  targetProtein: number;
  targetFat: number;
  targetCarbs: number;
};

/** Default nutrition targets for new users */
export const DEFAULT_NUTRITION_TARGET: Omit<NutritionTarget, "id" | "userId"> =
  {
    targetCalories: 2000,
    targetProtein: 60,
    targetFat: 55,
    targetCarbs: 300,
  };
