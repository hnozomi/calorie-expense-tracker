"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod/v4";
import type { ActionResult } from "@/lib/action-result";
import { revalidateAllScreens } from "@/lib/revalidate-screens";
import { createClient } from "@/lib/supabase/server";
import { getSignedInUserId } from "@/lib/supabase/user";
import { MEAL_TYPES, SOURCE_TYPES } from "@/types";
import { isValidDateString, shiftDate } from "@/utils";
import { mealItemFormSchema } from "../types/meal";

// Action arguments come from the client and can be anything, so every input is parsed here
const dateSchema = z.string().refine(isValidDateString);
const mealTypeSchema = z.enum(MEAL_TYPES);
const idSchema = z.uuid();

const draftItemSchema = mealItemFormSchema.extend({
  sourceType: z.enum(SOURCE_TYPES),
  foodMasterId: idSchema.optional(),
  recipeId: idSchema.optional(),
  setMenuId: idSchema.optional(),
});

const registerInputSchema = z.object({
  date: dateSchema,
  mealType: mealTypeSchema,
  items: z.array(draftItemSchema).min(1),
});

const slotInputSchema = z.object({
  date: dateSchema,
  mealType: mealTypeSchema,
});

const updateInputSchema = z.object({
  itemId: idSchema,
  values: mealItemFormSchema,
});

const deleteInputSchema = z.object({ itemId: idSchema });

type RpcMealItem = {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  cost: number | null;
  source_type: string;
  food_master_id: string | null;
  recipe_id: string | null;
  set_menu_id: string | null;
};

/** Create the day's meal row for the slot if needed, then add the items in one transaction */
const insertMealItems = async (
  supabase: SupabaseClient,
  userId: string,
  date: string,
  mealType: string,
  items: RpcMealItem[],
): Promise<boolean> => {
  const { data: meal, error: mealError } = await supabase
    .from("meals")
    .upsert(
      { date, meal_type: mealType, user_id: userId },
      { onConflict: "user_id,date,meal_type" },
    )
    .select("id")
    .single();
  if (mealError) return false;

  const { error } = await supabase.rpc("register_meal_items", {
    p_meal_id: meal.id,
    p_items: items,
  });
  return !error;
};

/** Register the drafts from the register drawer into one slot */
export const registerMealItems = async (
  input: unknown,
): Promise<ActionResult> => {
  const parsed = registerInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { date, mealType, items } = parsed.data;

  const supabase = await createClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) return { ok: false };

  const isSaved = await insertMealItems(
    supabase,
    userId,
    date,
    mealType,
    items.map((item) => ({
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
      cost: item.cost ?? null,
      source_type: item.sourceType,
      food_master_id: item.foodMasterId ?? null,
      recipe_id: item.recipeId ?? null,
      set_menu_id: item.setMenuId ?? null,
    })),
  );
  if (!isSaved) return { ok: false };
  revalidateAllScreens();
  return { ok: true };
};

/** Overwrite one meal item's name, nutrition and cost */
export const updateMealItem = async (input: unknown): Promise<ActionResult> => {
  const parsed = updateInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { itemId, values } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meal_items")
    .update({
      name: values.name,
      calories: values.calories,
      protein: values.protein,
      fat: values.fat,
      carbs: values.carbs,
      cost: values.cost ?? null,
    })
    .eq("id", itemId)
    .select("id");
  // No row means it was deleted meanwhile (or is not this user's); saying "saved" would be wrong
  if (error || data.length === 0) return { ok: false };
  revalidateAllScreens();
  return { ok: true };
};

export const deleteMealItem = async (input: unknown): Promise<ActionResult> => {
  const parsed = deleteInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meal_items")
    .delete()
    .eq("id", parsed.data.itemId)
    .select("id");
  if (error || data.length === 0) return { ok: false };
  revalidateAllScreens();
  return { ok: true };
};

/** Copy the previous day's items in the same slot. copiedCount is 0 when that slot was empty */
export const copyPreviousDayMeal = async (
  input: unknown,
): Promise<ActionResult<{ copiedCount: number }>> => {
  const parsed = slotInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { date, mealType } = parsed.data;

  const supabase = await createClient();
  const { data: previousMeal, error: fetchError } = await supabase
    .from("meals")
    .select("id, meal_items(*)")
    .eq("date", shiftDate(date, -1))
    .eq("meal_type", mealType)
    .maybeSingle();
  if (fetchError) return { ok: false };

  const previousItems = [...(previousMeal?.meal_items ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  if (previousItems.length === 0) return { ok: true, copiedCount: 0 };

  const userId = await getSignedInUserId(supabase);
  if (!userId) return { ok: false };

  const isSaved = await insertMealItems(
    supabase,
    userId,
    date,
    mealType,
    previousItems.map((item) => ({
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
      cost: item.cost,
      source_type: item.source_type,
      food_master_id: item.food_master_id,
      recipe_id: item.recipe_id,
      set_menu_id: item.set_menu_id,
    })),
  );
  if (!isSaved) return { ok: false };
  revalidateAllScreens();
  return { ok: true, copiedCount: previousItems.length };
};

/** Add the slot's registered items to the meal plan of the same day */
export const transferMealToPlan = async (
  input: unknown,
): Promise<ActionResult> => {
  const parsed = slotInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase.rpc("transfer_meal_to_plan", {
    p_target_date: parsed.data.date,
    p_meal_type: parsed.data.mealType,
  });
  if (error) return { ok: false };
  revalidateAllScreens();
  return { ok: true };
};
