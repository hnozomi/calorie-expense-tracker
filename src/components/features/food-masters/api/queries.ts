import "server-only";
import { cacheLife } from "next/cache";
import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import { toFoodMaster } from "@/components/features/food-masters/utils/to-food-master";
import { SCREEN_CACHE } from "@/lib/screen-cache";
import { createClient } from "@/lib/supabase/server";

export const getFoodMasters = async (): Promise<FoodMaster[]> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_masters")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toFoodMaster);
};

/** One food master for its edit screen, or null when the id is unknown or the master was deleted (the route returns 404) */
export const getFoodMaster = async (id: string): Promise<FoodMaster | null> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_masters")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data ? toFoodMaster(data) : null;
};
