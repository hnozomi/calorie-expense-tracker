"use server";

import { z } from "zod/v4";
import { fetchCsvRows } from "@/components/features/settings/api/csv-rows";
import type { CsvRow } from "@/components/features/settings/csv-export-config";
import type { ActionResult } from "@/lib/action-result";
import { revalidateAllScreens } from "@/lib/revalidate-screens";
import { createClient } from "@/lib/supabase/server";
import { getSignedInUserId } from "@/lib/supabase/user";

// Action arguments come from the client and can be anything, so every input is parsed here
const targetInputSchema = z.object({
  targetCalories: z.number().min(1).max(10000),
  targetProtein: z.number().min(0).max(1000),
  targetFat: z.number().min(0).max(1000),
  targetCarbs: z.number().min(0).max(2000),
});

const csvInputSchema = z.object({
  type: z.enum(["meals", "recipes", "food_masters", "set_menus"]),
  period: z.enum(["all", "this_month", "last_month"]),
});

export const saveNutritionTarget = async (
  input: unknown,
): Promise<ActionResult> => {
  const parsed = targetInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) return { ok: false };

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      target_calories: parsed.data.targetCalories,
      target_protein: parsed.data.targetProtein,
      target_fat: parsed.data.targetFat,
      target_carbs: parsed.data.targetCarbs,
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false };
  revalidateAllScreens();
  return { ok: true };
};

// Only parent tables: meal_items, recipe_ingredients and set_menu_items go with them (ON DELETE CASCADE)
const DELETE_ALL_TABLES = [
  "meals",
  "meal_plans",
  "set_menus",
  "recipes",
  "food_masters",
] as const;

/** Delete every record of the signed-in user. Stops at the first failure, so some tables may already be empty */
export const deleteAllData = async (): Promise<ActionResult> => {
  const supabase = await createClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) return { ok: false };

  for (const table of DELETE_ALL_TABLES) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId);
    if (error) {
      revalidateAllScreens();
      return { ok: false };
    }
  }
  revalidateAllScreens();
  return { ok: true };
};

/** The rows of one CSV export; the browser turns them into the file */
export const exportCsvRows = async (
  input: unknown,
): Promise<ActionResult<{ rows: CsvRow[] }>> => {
  const parsed = csvInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  try {
    const rows = await fetchCsvRows(
      supabase,
      parsed.data.type,
      parsed.data.period,
    );
    return { ok: true, rows };
  } catch {
    return { ok: false };
  }
};
