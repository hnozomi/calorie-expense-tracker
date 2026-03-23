"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { SetMenu, SetMenuItem } from "../types/set-menu";

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
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map(
        (row): SetMenu => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          totalCalories: Number(row.total_calories),
          totalProtein: Number(row.total_protein),
          totalFat: Number(row.total_fat),
          totalCarbs: Number(row.total_carbs),
          totalCost: Number(row.total_cost),
          deletedAt: row.deleted_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          items: (row.set_menu_items ?? []).map(
            (item: Record<string, unknown>): SetMenuItem => ({
              id: item.id as string,
              setMenuId: item.set_menu_id as string,
              name: item.name as string,
              recipeId: (item.recipe_id as string) ?? null,
              foodMasterId: (item.food_master_id as string) ?? null,
              calories: Number(item.calories),
              protein: Number(item.protein),
              fat: Number(item.fat),
              carbs: Number(item.carbs),
              cost: Number(item.cost),
              servingQuantity: Number(item.serving_quantity),
              sortOrder: Number(item.sort_order),
            }),
          ),
        }),
      );
    },
  });
};
