import "server-only";
import { cacheLife } from "next/cache";
import { toNutritionTarget } from "@/components/features/settings/utils/to-nutrition-target";
import { SCREEN_CACHE } from "@/lib/screen-cache";
import { createClient } from "@/lib/supabase/server";
import type { NutritionTarget } from "@/types/settings";

// Users who never saved targets have no row; they get the defaults
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

/** The signed-in account's email, shown on the settings screen */
export const getAccountEmail = async (): Promise<string | null> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email;
  return typeof email === "string" ? email : null;
};
