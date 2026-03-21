import { z } from "zod/v4";
import type { NutritionValues } from "@/types";

/** A set menu item (references a recipe or food master) */
export type SetMenuItem = NutritionValues & {
  id: string;
  setMenuId: string;
  name: string;
  recipeId: string | null;
  foodMasterId: string | null;
  cost: number;
  servingQuantity: number;
  sortOrder: number;
};

/** A set menu with its items */
export type SetMenu = {
  id: string;
  userId: string;
  name: string;
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  totalCost: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: SetMenuItem[];
};

/** Zod schema for set menu form validation */
export const setMenuFormSchema = z.object({
  name: z.string().min(1, "セットメニュー名を入力してください"),
});

export type SetMenuFormValues = z.infer<typeof setMenuFormSchema>;

/** Draft item for set menu creation/editing */
export type SetMenuItemDraft = NutritionValues & {
  tempId: string;
  name: string;
  recipeId: string | null;
  foodMasterId: string | null;
  cost: number;
  servingQuantity: number;
};
