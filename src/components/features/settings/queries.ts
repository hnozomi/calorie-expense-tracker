import type { SupabaseClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import type { NutritionTarget } from "@/types/settings";
import { toNutritionTarget } from "./utils/to-nutrition-target";

export const getNutritionTargetQueryOptions = (supabase: SupabaseClient) =>
  queryOptions({
    queryKey: queryKeys.settings.nutritionTarget(),
    queryFn: async (): Promise<NutritionTarget> => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;

      return toNutritionTarget(data);
    },
  });
