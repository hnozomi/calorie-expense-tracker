"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/hooks";

/** Hook for deleting all user data with confirmation */
export const useDeleteAllData = () => {
  const supabase = useSupabase();
  const [isDeleting, setIsDeleting] = useState(false);

  /** Delete all user data across all tables */
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

      toast.success("全データを削除しました");
    } catch (error) {
      console.error("Failed to delete all data:", error);
      toast.error("データの削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  }, [supabase]);

  return { isDeleting, deleteAllData };
};
