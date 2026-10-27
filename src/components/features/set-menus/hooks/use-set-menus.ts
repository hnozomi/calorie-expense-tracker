"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import { toSetMenu } from "../utils/to-set-menu";

/** Fetch set menus list with items, excluding soft-deleted */
export const useSetMenus = () => {
  const supabase = useSupabase();

  return useSuspenseQuery({
    queryKey: queryKeys.setMenus.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("set_menus")
        .select("*, set_menu_items(*)")
        .is("deleted_at", null)
        .order("name", { ascending: true });

      if (error) throw error;

      return (data ?? []).map(toSetMenu);
    },
  });
};
