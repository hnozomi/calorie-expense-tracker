"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, useListCacheSeed, useSupabase } from "@/hooks";
import type { FoodMaster } from "../types/food-master";

/** Stable prefix matching every cached food-masters list query */
const FOOD_MASTERS_LIST_KEY_PREFIX = ["food-masters", "list"] as const;

/** Fetch a single food master by ID */
export const useFoodMasterDetail = (id: string | undefined) => {
  const supabase = useSupabase();
  // The list already fetched full rows, so seed from it and skip the
  // loading skeleton when arriving from the list
  const seed = useListCacheSeed<FoodMaster>(FOOD_MASTERS_LIST_KEY_PREFIX, id);

  return useQuery({
    queryKey: queryKeys.foodMasters.detail(id ?? ""),
    enabled: !!id && id !== "new",
    initialData: seed?.data,
    initialDataUpdatedAt: seed?.updatedAt,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_masters")
        .select("*")
        .eq("id", id!)
        .maybeSingle();

      if (error) throw error;
      // Row is missing when the id is invalid or the record was deleted
      if (!data) return null;

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
