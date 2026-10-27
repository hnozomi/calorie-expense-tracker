import { cacheLife } from "next/cache";
import { SCREEN_CACHE } from "@/lib/screen-cache";
import { createClient } from "@/lib/supabase/server";
import type { FoodMaster } from "../types/food-master";
import { toFoodMaster } from "../utils/to-food-master";

/** Food masters that are not deleted, by name */
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
