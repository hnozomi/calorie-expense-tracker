"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import { toFoodMaster } from "../utils/to-food-master";

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
