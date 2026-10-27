import "server-only";
import { cacheLife } from "next/cache";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import { toRecipe } from "@/components/features/recipes/utils/to-recipe";
import { SCREEN_CACHE } from "@/lib/screen-cache";
import { createClient } from "@/lib/supabase/server";

export const getRecipes = async (): Promise<Recipe[]> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*)")
    .is("deleted_at", null)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toRecipe);
};

/** One recipe for its edit screen, or null when the id is unknown or the recipe was deleted (the route returns 404) */
export const getRecipe = async (id: string): Promise<Recipe | null> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data ? toRecipe(data) : null;
};
