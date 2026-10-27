"use server";

import { z } from "zod/v4";
import type { ActionResult } from "@/lib/action-result";
import { revalidateAllScreens } from "@/lib/revalidate-screens";
import { createClient } from "@/lib/supabase/server";
import { ingredientSchema, recipeFormSchema } from "../types/recipe";

// Action arguments come from the client and can be anything, so every input is parsed here
const idSchema = z.uuid();

const saveInputSchema = z.object({
  id: idSchema.optional(),
  values: recipeFormSchema,
  ingredients: z.array(ingredientSchema),
});

/** Create a recipe, or overwrite the one being edited, together with its ingredients */
export const saveRecipe = async (input: unknown): Promise<ActionResult> => {
  const parsed = saveInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { id, values, ingredients } = parsed.data;

  const supabase = await createClient();
  // One RPC so a failure halfway cannot leave the recipe without its ingredients
  const { error } = await supabase.rpc("save_recipe_with_ingredients", {
    p_id: id ?? null,
    p_name: values.name,
    p_servings: values.servings,
    p_calories: values.calories,
    p_protein: values.protein,
    p_fat: values.fat,
    p_carbs: values.carbs,
    p_notes: values.notes || null,
    p_ingredients: ingredients.map((ingredient) => ({
      ingredient_name: ingredient.ingredientName,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      unit_price: ingredient.unitPrice,
    })),
  });
  if (error) return { ok: false };
  revalidateAllScreens();
  return { ok: true };
};

/** Soft-delete: meals and plans that used the recipe keep their own copy of the values */
export const deleteRecipe = async (input: unknown): Promise<ActionResult> => {
  const parsed = z.object({ id: idSchema }).safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .is("deleted_at", null)
    .select("id");
  if (error || data.length === 0) return { ok: false };
  revalidateAllScreens();
  return { ok: true };
};
