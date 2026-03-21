"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";

/** Soft-delete a set menu by setting deleted_at */
export const useDeleteSetMenu = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("set_menus")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.setMenus.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.setMenus.detail(id),
      });
    },
  });
};
