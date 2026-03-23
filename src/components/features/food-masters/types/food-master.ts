import { z } from "zod/v4";
import {
  FOOD_CATEGORIES,
  type FoodCategory,
  type NutritionValues,
} from "@/types";

/** A food master record for reusable food items */
export type FoodMaster = NutritionValues & {
  id: string;
  userId: string;
  name: string;
  brand: string | null;
  category: FoodCategory | null;
  defaultPrice: number | null;
  notes: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Zod schema for food master form validation */
export const foodMasterFormSchema = z.object({
  name: z.string().min(1, "食品名を入力してください"),
  brand: z.string().optional(),
  category: z.enum(FOOD_CATEGORIES).optional(),
  calories: z.coerce.number().min(0, "0以上で入力してください"),
  protein: z.coerce.number().min(0, "0以上で入力してください"),
  fat: z.coerce.number().min(0, "0以上で入力してください"),
  carbs: z.coerce.number().min(0, "0以上で入力してください"),
  defaultPrice: z.coerce.number().min(0, "0以上で入力してください").optional(),
  notes: z.string().optional(),
});

export type FoodMasterFormInput = z.input<typeof foodMasterFormSchema>;
export type FoodMasterFormValues = z.output<typeof foodMasterFormSchema>;
