"use server";

import { z } from "zod/v4";
import type { ActionResult } from "@/lib/action-result";
import { revalidateAllScreens } from "@/lib/revalidate-screens";
import { createClient } from "@/lib/supabase/server";
import { getSignedInUserId } from "@/lib/supabase/user";
import { foodMasterFormSchema } from "../types/food-master";

// Action arguments come from the client and can be anything, so every input is parsed here
const idSchema = z.uuid();

const saveInputSchema = z.object({
  id: idSchema.optional(),
  values: foodMasterFormSchema,
});

/** Create a food master, or overwrite the one being edited */
export const saveFoodMaster = async (input: unknown): Promise<ActionResult> => {
  const parsed = saveInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { id, values } = parsed.data;

  const supabase = await createClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) return { ok: false };

  const row = {
    user_id: userId,
    name: values.name,
    brand: values.brand || null,
    category: values.category || null,
    calories: values.calories,
    protein: values.protein,
    fat: values.fat,
    carbs: values.carbs,
    default_price: values.defaultPrice ?? null,
    notes: values.notes || null,
  };
  const { data, error } = id
    ? await supabase
        .from("food_masters")
        .update(row)
        .eq("id", id)
        .is("deleted_at", null)
        .select("id")
    : await supabase.from("food_masters").insert(row).select("id");
  // No row on update means it was deleted meanwhile; saying "saved" would be wrong
  if (error || data.length === 0) return { ok: false };
  revalidateAllScreens();
  return { ok: true };
};

/** Soft-delete: meals and plans that used the master keep their own copy of the values */
export const deleteFoodMaster = async (
  input: unknown,
): Promise<ActionResult> => {
  const parsed = z.object({ id: idSchema }).safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_masters")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .is("deleted_at", null)
    .select("id");
  if (error || data.length === 0) return { ok: false };
  revalidateAllScreens();
  return { ok: true };
};
