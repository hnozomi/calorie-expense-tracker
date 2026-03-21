"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { SetMenu, SetMenuItem } from "../types/set-menu";

/** Fetch a single set menu by ID with items */
export const useSetMenuDetail = (id: string | undefined) => {
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.setMenus.detail(id ?? ""),
    enabled: !!id && id !== "new",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("set_menus")
        .select("*, set_menu_items(*)")
        .eq("id", id!)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        totalCalories: Number(data.total_calories),
        totalProtein: Number(data.total_protein),
        totalFat: Number(data.total_fat),
        totalCarbs: Number(data.total_carbs),
        totalCost: Number(data.total_cost),
        deletedAt: data.deleted_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        items: (data.set_menu_items ?? []).map(
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
      } satisfies SetMenu;
    },
  });
};
