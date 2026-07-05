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

      // Save menu and items atomically so a mid-save failure
      // cannot leave the menu without its items
      const { data, error } = await supabase.rpc("save_set_menu_with_items", {
        p_id: id ?? null,
        p_name: name,
        p_total_calories: totals.totalCalories,
        p_total_protein: totals.totalProtein,
        p_total_fat: totals.totalFat,
        p_total_carbs: totals.totalCarbs,
        p_total_cost: totals.totalCost,
        p_items: items.map((item) => ({
          name: item.name,
          recipe_id: item.recipeId,
          food_master_id: item.foodMasterId,
          calories: item.calories,
          protein: item.protein,
          fat: item.fat,
          carbs: item.carbs,
          cost: item.cost,
          serving_quantity: item.servingQuantity,
        })),
      });
      if (error) throw error;

      return data as string;
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
