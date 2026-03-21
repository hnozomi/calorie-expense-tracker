"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { FoodMaster } from "../types/food-master";

/** Fetch a single food master by ID */
export const useFoodMasterDetail = (id: string | undefined) => {
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.foodMasters.detail(id ?? ""),
    enabled: !!id && id !== "new",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_masters")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) throw error;

      const row = data;
      return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        brand: row.brand,
        category: row.category,
        calories: Number(row.calories),
        protein: Number(row.protein),
        fat: Number(row.fat),
        carbs: Number(row.carbs),
        defaultPrice: row.default_price ? Number(row.default_price) : null,
        notes: row.notes,
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      } satisfies FoodMaster;
    },
  });
};
