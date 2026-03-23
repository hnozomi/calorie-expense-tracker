import { z } from "zod/v4";
import type { MealType, NutritionValues, SourceType } from "@/types";

/** A meal record (e.g. breakfast on 2026-03-21) */
export type Meal = {
  id: string;
  userId: string;
  date: string;
  mealType: MealType;
  items: MealItem[];
  createdAt: string;
  updatedAt: string;
};

/** An individual food item within a meal */
export type MealItem = NutritionValues & {
  id: string;
  mealId: string;
  name: string;
  cost: number | null;
  sourceType: SourceType;
  recipeId: string | null;
  foodMasterId: string | null;
  setMenuId: string | null;
  servingQuantity: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/** Summary row returned by get_daily_summary RPC */
export type DailySummaryRow = NutritionValues & {
  mealType: MealType;
  totalCost: number;
  itemCount: number;
};

/** Form values for manual meal item input */
export const mealItemFormSchema = z.object({
  name: z.string().min(1, "メニュー名を入力してください"),
  calories: z.coerce.number().min(0, "0以上で入力してください"),
  protein: z.coerce.number().min(0, "0以上で入力してください"),
  fat: z.coerce.number().min(0, "0以上で入力してください"),
  carbs: z.coerce.number().min(0, "0以上で入力してください"),
  cost: z.coerce.number().min(0, "0以上で入力してください").optional(),
});

export type MealItemFormInput = z.input<typeof mealItemFormSchema>;
export type MealItemFormValues = z.output<typeof mealItemFormSchema>;

/** Draft item in the registration card (before saving to DB) */
export type MealItemDraft = MealItemFormValues & {
  tempId: string;
  sourceType: SourceType;
};
