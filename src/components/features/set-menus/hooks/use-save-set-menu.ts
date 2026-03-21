"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { SetMenuItemDraft } from "../types/set-menu";

type SaveParams = {
  id?: string;
  name: string;
  items: SetMenuItemDraft[];
};

/** Create or update a set menu with its items */
export const useSaveSetMenu = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, items }: SaveParams) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");

      /** Calculate totals from items */
      const totals = items.reduce(
        (acc, item) => ({
          totalCalories:
            acc.totalCalories + item.calories * item.servingQuantity,
          totalProtein: acc.totalProtein + item.protein * item.servingQuantity,
          totalFat: acc.totalFat + item.fat * item.servingQuantity,
          totalCarbs: acc.totalCarbs + item.carbs * item.servingQuantity,
          totalCost: acc.totalCost + item.cost * item.servingQuantity,
        }),
        {
          totalCalories: 0,
          totalProtein: 0,
          totalFat: 0,
          totalCarbs: 0,
          totalCost: 0,
        },
      );

      const menuPayload = {
        user_id: user.id,
        name,
        total_calories: totals.totalCalories,
        total_protein: totals.totalProtein,
        total_fat: totals.totalFat,
        total_carbs: totals.totalCarbs,
        total_cost: totals.totalCost,
      };

      let menuId: string;

      if (id) {
        const { error } = await supabase
          .from("set_menus")
          .update(menuPayload)
          .eq("id", id);
        if (error) throw error;
        menuId = id;

        // Delete existing items and re-insert
        const { error: deleteError } = await supabase
          .from("set_menu_items")
          .delete()
          .eq("set_menu_id", id);
        if (deleteError) throw deleteError;
      } else {
        const { data, error } = await supabase
          .from("set_menus")
          .insert(menuPayload)
          .select("id")
          .single();
        if (error) throw error;
        menuId = data.id;
      }

      // Insert items
      if (items.length > 0) {
        const itemRows = items.map((item, index) => ({
          set_menu_id: menuId,
          name: item.name,
          recipe_id: item.recipeId,
          food_master_id: item.foodMasterId,
          calories: item.calories,
          protein: item.protein,
          fat: item.fat,
          carbs: item.carbs,
          cost: item.cost,
          serving_quantity: item.servingQuantity,
          sort_order: index,
        }));

        const { error: itemError } = await supabase
          .from("set_menu_items")
          .insert(itemRows);
        if (itemError) throw itemError;
      }

      return menuId;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.setMenus.all,
      });
      if (id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.setMenus.detail(id),
        });
      }
    },
  });
};
