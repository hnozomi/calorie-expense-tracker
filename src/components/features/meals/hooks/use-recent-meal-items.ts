"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { SourceType } from "@/types";
import {
  dedupeRecentItemsByName,
  type RecentMealItem,
} from "../utils/recent-meal-items";

const FETCH_LIMIT = 100;
const DISPLAY_LIMIT = 20;

/** Fetch the user's recently registered items, deduped by name */
export const useRecentMealItems = () => {
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.meals.recentItems(),
    queryFn: async (): Promise<RecentMealItem[]> => {
      const { data, error } = await supabase
        .from("meal_items")
        .select(
          "name, calories, protein, fat, carbs, cost, source_type, recipe_id, food_master_id, set_menu_id, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(FETCH_LIMIT);

      if (error) throw error;

      const items: RecentMealItem[] = (data ?? []).map((row) => ({
        name: row.name,
        calories: Number(row.calories),
        protein: Number(row.protein),
        fat: Number(row.fat),
        carbs: Number(row.carbs),
        cost: row.cost === null ? null : Number(row.cost),
        sourceType: row.source_type as SourceType,
        recipeId: row.recipe_id,
        foodMasterId: row.food_master_id,
        setMenuId: row.set_menu_id,
      }));

      return dedupeRecentItemsByName(items, DISPLAY_LIMIT);
    },
  });
};
