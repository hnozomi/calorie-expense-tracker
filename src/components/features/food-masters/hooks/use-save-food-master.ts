"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { FoodMasterFormValues } from "../types/food-master";

type SaveParams = {
  id?: string;
  values: FoodMasterFormValues;
};

/** Create or update a food master record */
export const useSaveFoodMaster = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: SaveParams) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");

      const payload = {
        user_id: user.id,
        name: values.name,
        brand: values.brand || null,
        category: values.category || null,
        calories: values.calories,
        protein: values.protein,
        fat: values.fat,
        carbs: values.carbs,
        default_price: values.defaultPrice ?? null,
        notes: values.notes || null,
      };

      if (id) {
        const { error } = await supabase
          .from("food_masters")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        return id;
      }

      const { data, error } = await supabase
        .from("food_masters")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.foodMasters.all,
      });
      if (id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.foodMasters.detail(id),
        });
      }
    },
  });
};
