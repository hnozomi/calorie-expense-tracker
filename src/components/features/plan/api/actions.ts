"use server";

import { z } from "zod/v4";
import type { ActionResult } from "@/lib/action-result";
import { revalidateAllScreens } from "@/lib/revalidate-screens";
import { createClient } from "@/lib/supabase/server";
import { getSignedInUserId } from "@/lib/supabase/user";
import { MEAL_TYPES } from "@/types";
import { isValidDateString } from "@/utils";
import { mealPlanFormSchema } from "../types/meal-plan";

// Action arguments come from the client and can be anything, so every input is parsed here
const dateSchema = z.string().refine(isValidDateString);
const mealTypeSchema = z.enum(MEAL_TYPES);
const idSchema = z.uuid();

const saveInputSchema = z.object({
  id: idSchema.optional(),
  date: dateSchema,
  mealType: mealTypeSchema,
  values: mealPlanFormSchema,
  recipeId: idSchema.nullable(),
  foodMasterId: idSchema.nullable(),
  setMenuId: idSchema.nullable(),
});

const transferInputSchema = z.object({
  date: dateSchema,
  mealTypes: z.array(mealTypeSchema).min(1),
});

const syncInputSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
});

/** Add a plan to a cell, or overwrite the plan being edited */
export const saveMealPlan = async (input: unknown): Promise<ActionResult> => {
  const parsed = saveInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { id, date, mealType, values, recipeId, foodMasterId, setMenuId } =
    parsed.data;

  const supabase = await createClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) return { ok: false };

  const row = {
    date,
    meal_type: mealType,
    planned_name: values.plannedName,
    calories: values.calories,
    protein: values.protein,
    fat: values.fat,
    carbs: values.carbs,
    estimated_cost: values.estimatedCost,
    recipe_id: recipeId,
    food_master_id: foodMasterId,
    set_menu_id: setMenuId,
  };
  const { data, error } = id
    ? await supabase.from("meal_plans").update(row).eq("id", id).select("id")
    : await supabase
        .from("meal_plans")
        .insert({ ...row, user_id: userId })
        .select("id");
  // No row on update means the plan was deleted meanwhile; saying "saved" would be wrong
  if (error || data.length === 0) return { ok: false };
  revalidateAllScreens();
  return { ok: true };
};

export const deleteMealPlan = async (input: unknown): Promise<ActionResult> => {
  const parsed = z.object({ id: idSchema }).safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meal_plans")
    .delete()
    .eq("id", parsed.data.id)
    .select("id");
  if (error || data.length === 0) return { ok: false };
  revalidateAllScreens();
  return { ok: true };
};

// Slots are moved one RPC at a time, so a failure can leave some moved: the result reports how many did
// (fewer than mealTypes means it stopped partway) instead of a plain failure
/** Copy the day's untransferred plans into the meal record, slot by slot */
export const transferPlansToMeals = async (
  input: unknown,
): Promise<ActionResult<{ transferredCount: number }>> => {
  const parsed = transferInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { date, mealTypes } = parsed.data;

  const supabase = await createClient();
  let transferredCount = 0;
  for (const mealType of mealTypes) {
    const { error } = await supabase.rpc("transfer_plan_to_meal", {
      p_target_date: date,
      p_meal_type: mealType,
    });
    if (error) break;
    transferredCount += 1;
  }
  if (transferredCount > 0) revalidateAllScreens();
  return { ok: true, transferredCount };
};

/** Replace past plans with what was actually eaten. replacedCount is the number of slots replaced */
export const syncMealsToPlans = async (
  input: unknown,
): Promise<ActionResult<{ replacedCount: number }>> => {
  const parsed = syncInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sync_meals_to_plans", {
    p_start_date: parsed.data.startDate,
    p_end_date: parsed.data.endDate,
  });
  if (error) return { ok: false };
  revalidateAllScreens();
  return { ok: true, replacedCount: Number(data) };
};
