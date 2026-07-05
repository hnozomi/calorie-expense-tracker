"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { FoodMaster } from "../types/food-master";

/** Fetch food masters list with optional search, excluding soft-deleted */
export const useFoodMasters = (search?: string) => {
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.foodMasters.list(search),
    queryFn: async () => {
      let query = supabase
        .from("food_masters")
        .select("*")
        .is("deleted_at", null)
        .order("name", { ascending: true });

      if (search && search.trim().length > 0) {
        // Strip PostgREST or() syntax characters so the filter stays valid
        const term = search.trim().replace(/[,()]/g, "");
        query = query.or(`name.ilike.%${term}%,brand.ilike.%${term}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map(
        (row): FoodMaster => ({
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
        }),
      );
    },
  });
};
