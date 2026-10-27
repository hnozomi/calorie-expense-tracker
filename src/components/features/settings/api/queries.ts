import { cacheLife } from "next/cache";
import { SCREEN_CACHE } from "@/lib/screen-cache";
import { createClient } from "@/lib/supabase/server";
import type { NutritionTarget } from "@/types/settings";
import { toNutritionTarget } from "../utils/to-nutrition-target";

/** The user's nutrition targets, or the defaults before any are saved */
export const getNutritionTarget = async (): Promise<NutritionTarget> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return toNutritionTarget(data);
};
