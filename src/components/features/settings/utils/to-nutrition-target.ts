import type { Tables } from "@/lib/supabase/database.types";
import {
  DEFAULT_NUTRITION_TARGET,
  type NutritionTarget,
} from "@/types/settings";

/** A user_settings row, or the defaults when the user has not saved any targets yet */
export const toNutritionTarget = (
  row: Tables<"user_settings"> | null,
): NutritionTarget =>
  row
    ? {
        id: row.id,
        userId: row.user_id,
        targetCalories: Number(row.target_calories),
        targetProtein: Number(row.target_protein),
        targetFat: Number(row.target_fat),
        targetCarbs: Number(row.target_carbs),
      }
    : { id: "", userId: "", ...DEFAULT_NUTRITION_TARGET };
