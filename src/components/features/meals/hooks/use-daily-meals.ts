"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { queryKeys, useSupabase } from "@/hooks";
import type { MealType } from "@/types";
import type { MealItem } from "../types/meal";

/** Fetch all meal items grouped by meal_type for a given date */
export const useDailyMeals = (date: string) => {
  const supabase = useSupabase();

  return useSuspenseQuery({
    queryKey: queryKeys.meals.daily(date),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select("id, meal_type, meal_items(*)")
        .eq("date", date)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const grouped: Record<
        MealType,
        { mealId: string | null; items: MealItem[] }
      > = {
        breakfast: { mealId: null, items: [] },
        lunch: { mealId: null, items: [] },
        dinner: { mealId: null, items: [] },
        snack: { mealId: null, items: [] },
      };

      for (const meal of data ?? []) {
        const mealType = meal.meal_type as MealType;
        grouped[mealType] = {
          mealId: meal.id,
          items: ((meal.meal_items as Record<string, unknown>[]) ?? []).map(
            (item) => ({
              id: item.id as string,
              mealId: item.meal_id as string,
              name: item.name as string,
              calories: item.calories as number,
              protein: item.protein as number,
              fat: item.fat as number,
              carbs: item.carbs as number,
              cost: item.cost as number | null,
              sourceType: item.source_type as MealItem["sourceType"],
              recipeId: item.recipe_id as string | null,
              foodMasterId: item.food_master_id as string | null,
              setMenuId: item.set_menu_id as string | null,
              servingQuantity: item.serving_quantity as number,
              sortOrder: item.sort_order as number,
              createdAt: item.created_at as string,
              updatedAt: item.updated_at as string,
            }),
          ),
        };
      }

      return grouped;
    },
  });
};
