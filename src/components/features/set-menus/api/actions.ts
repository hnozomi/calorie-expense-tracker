"use server";

import { z } from "zod/v4";
import { setMenuFormSchema } from "@/components/features/set-menus/types/set-menu";
import { calculateSetMenuTotals } from "@/components/features/set-menus/utils/set-menu-totals";
import type { ActionResult } from "@/lib/action-result";
import { revalidateAllScreens } from "@/lib/revalidate-screens";
import { createClient } from "@/lib/supabase/server";

// Action arguments come from the client and can be anything, so every input is parsed here
const idSchema = z.uuid();

const itemSchema = z.object({
  name: z.string().min(1),
  recipeId: idSchema.nullable(),
  foodMasterId: idSchema.nullable(),
  calories: z.number().min(0),
  protein: z.number().min(0),
  fat: z.number().min(0),
  carbs: z.number().min(0),
  cost: z.number().min(0),
  servingQuantity: z.number().min(0.5),
});

const saveInputSchema = z.object({
  id: idSchema.optional(),
  values: setMenuFormSchema,
  items: z.array(itemSchema).min(1),
});

export const saveSetMenu = async (input: unknown): Promise<ActionResult> => {
  const parsed = saveInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { id, values, items } = parsed.data;
  // Totals are computed here, not taken from the client, so they always match the items
  const totals = calculateSetMenuTotals(items);

  const supabase = await createClient();
  // One RPC so a failure halfway cannot leave the set menu without its items
  const { error } = await supabase.rpc("save_set_menu_with_items", {
    p_id: id ?? null,
    p_name: values.name,
    p_total_calories: totals.calories,
    p_total_protein: totals.protein,
    p_total_fat: totals.fat,
    p_total_carbs: totals.carbs,
    p_total_cost: totals.cost,
    p_items: items.map((item) => ({
      name: item.name,
      recipe_id: item.recipeId,
      food_master_id: item.foodMasterId,
      calories: item.calories,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
      cost: item.cost,
      serving_quantity: item.servingQuantity,
    })),
  });
  if (error) return { ok: false };
  revalidateAllScreens();
  return { ok: true };
};

/** Soft-delete: meals that used the set menu keep their own copy of the values */
export const deleteSetMenu = async (input: unknown): Promise<ActionResult> => {
  const parsed = z.object({ id: idSchema }).safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("set_menus")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .is("deleted_at", null)
    .select("id");
  if (error || data.length === 0) return { ok: false };
  revalidateAllScreens();
  return { ok: true };
};
