import { z } from "zod/v4";
import type { MealType, NutritionValues } from "@/types";

/** A meal plan entry for a specific date and meal type */
export type MealPlan = NutritionValues & {
  id: string;
  userId: string;
  date: string;
  mealType: MealType;
  plannedName: string;
  recipeId: string | null;
  foodMasterId: string | null;
  setMenuId: string | null;
  estimatedCost: number;
  isTransferred: boolean;
  createdAt: string;
};

/** Zod schema for meal plan form validation */
export const mealPlanFormSchema = z.object({
  plannedName: z.string().min(1, "メニュー名を入力してください"),
  calories: z.coerce.number().min(0, "0以上で入力してください"),
  protein: z.coerce.number().min(0, "0以上で入力してください"),
  fat: z.coerce.number().min(0, "0以上で入力してください"),
  carbs: z.coerce.number().min(0, "0以上で入力してください"),
  estimatedCost: z.coerce.number().min(0, "0以上で入力してください"),
});

export type MealPlanFormValues = z.infer<typeof mealPlanFormSchema>;

/** Daily summary row returned by get_weekly_summary RPC */
export type WeeklySummaryRow = NutritionValues & {
  date: string;
  totalCost: number;
};
