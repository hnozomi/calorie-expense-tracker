import { z } from "zod/v4";
import type { NutritionValues } from "@/types";

/** A recipe ingredient row */
export type RecipeIngredient = {
  id: string;
  recipeId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

/** A recipe record with its ingredients */
export type Recipe = NutritionValues & {
  id: string;
  userId: string;
  name: string;
  servings: number;
  notes: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ingredients: RecipeIngredient[];
};

/** Zod schema for a single ingredient row */
export const ingredientSchema = z.object({
  id: z.string().optional(),
  ingredientName: z.string().min(1, "材料名を入力してください"),
  quantity: z.coerce.number().min(0, "0以上で入力してください"),
  unit: z.string(),
  unitPrice: z.coerce.number().min(0, "0以上で入力してください"),
});

export type IngredientFormValues = z.infer<typeof ingredientSchema>;

/** Zod schema for recipe form validation */
export const recipeFormSchema = z.object({
  name: z.string().min(1, "レシピ名を入力してください"),
  servings: z.coerce.number().int().min(1, "1以上で入力してください"),
  calories: z.coerce.number().min(0, "0以上で入力してください"),
  protein: z.coerce.number().min(0, "0以上で入力してください"),
  fat: z.coerce.number().min(0, "0以上で入力してください"),
  carbs: z.coerce.number().min(0, "0以上で入力してください"),
  notes: z.string().optional(),
});

export type RecipeFormInput = z.input<typeof recipeFormSchema>;
export type RecipeFormValues = z.output<typeof recipeFormSchema>;
