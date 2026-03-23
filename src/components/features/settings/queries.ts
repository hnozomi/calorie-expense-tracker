import type { SupabaseClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import type { NutritionTarget } from "@/types/settings";
import { DEFAULT_NUTRITION_TARGET } from "@/types/settings";

export const getNutritionTargetQueryOptions = (supabase: SupabaseClient) =>
  queryOptions({
    queryKey: queryKeys.settings.nutritionTarget(),
    queryFn: async (): Promise<NutritionTarget> => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return {
          id: "",
          userId: "",
          ...DEFAULT_NUTRITION_TARGET,
        };
      }

      return {
        id: data.id,
        userId: data.user_id,
        targetCalories: Number(data.target_calories),
        targetProtein: Number(data.target_protein),
        targetFat: Number(data.target_fat),
        targetCarbs: Number(data.target_carbs),
      };
    },
  });
