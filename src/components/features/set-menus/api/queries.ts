import "server-only";
import { cacheLife } from "next/cache";
import type { SetMenu } from "@/components/features/set-menus/types/set-menu";
import { toSetMenu } from "@/components/features/set-menus/utils/to-set-menu";
import { SCREEN_CACHE } from "@/lib/screen-cache";
import { createClient } from "@/lib/supabase/server";

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

/** One set menu for its edit screen, or null when the id is unknown or the set menu was deleted (the route returns 404) */
export const getSetMenu = async (id: string): Promise<SetMenu | null> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("set_menus")
    .select("*, set_menu_items(*)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data ? toSetMenu(data) : null;
};
