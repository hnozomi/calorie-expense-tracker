import {
  DEFAULT_NUTRITION_TARGET,
  type NutritionTarget,
} from "@/types/settings";

// The Supabase client has no generated types, so rows arrive untyped; the casts follow the table definitions in supabase/migrations

/** A user_settings row, or the defaults when the user has not saved any targets yet */
export const toNutritionTarget = (
  row: Record<string, unknown> | null,
): NutritionTarget =>
  row
    ? {
        id: row.id as string,
        userId: row.user_id as string,
        targetCalories: Number(row.target_calories),
        targetProtein: Number(row.target_protein),
        targetFat: Number(row.target_fat),
        targetCarbs: Number(row.target_carbs),
      }
    : { id: "", userId: "", ...DEFAULT_NUTRITION_TARGET };
