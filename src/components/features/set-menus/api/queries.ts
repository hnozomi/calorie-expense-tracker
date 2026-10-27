import { cacheLife } from "next/cache";
import { SCREEN_CACHE } from "@/lib/screen-cache";
import { createClient } from "@/lib/supabase/server";
import type { SetMenu } from "../types/set-menu";
import { toSetMenu } from "../utils/to-set-menu";

/** Set menus that are not deleted, by name, with their items */
export const getSetMenus = async (): Promise<SetMenu[]> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("set_menus")
    .select("*, set_menu_items(*)")
    .is("deleted_at", null)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toSetMenu);
};
