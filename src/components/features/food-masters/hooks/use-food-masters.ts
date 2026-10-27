"use client";
// Client because the set menu form still reads food masters through TanStack Query (removed in phase 5)

import { useQuery } from "@tanstack/react-query";
import { toFoodMaster } from "@/components/features/food-masters/utils/to-food-master";
import { queryKeys, useSupabase } from "@/hooks";

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

      return (data ?? []).map(toFoodMaster);
    },
  });
};
