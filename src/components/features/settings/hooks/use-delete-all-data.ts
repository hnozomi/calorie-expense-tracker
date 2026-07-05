"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/hooks";

/** Hook for deleting all user data with confirmation */
export const useDeleteAllData = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  /** Delete all user data across all tables. Rethrows on failure so callers can react. */
  const deleteAllData = useCallback(async () => {
    setIsDeleting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      /** Delete parent tables only — child tables are CASCADE-deleted automatically
       *  (meal_items/meal_item_costs via meals, recipe_ingredients via recipes,
       *   set_menu_items via set_menus) */
      const tables = [
        "meals",
        "meal_plans",
        "set_menus",
        "recipes",
        "food_masters",
      ] as const;

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("user_id", user.id);
        if (error) {
          console.error(`Failed to delete ${table}:`, error);
          throw error;
        }
      }

      // Drop every cached query so deleted data disappears immediately app-wide
      queryClient.clear();

      toast.success("全データを削除しました");
    } catch (error) {
      console.error("Failed to delete all data:", error);
      toast.error(
        "データの削除に失敗しました。一部のデータのみ削除された可能性があります。もう一度お試しください。",
      );
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [queryClient, supabase]);

  return { isDeleting, deleteAllData };
};
