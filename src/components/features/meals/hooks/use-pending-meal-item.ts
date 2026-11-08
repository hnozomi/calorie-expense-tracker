"use client";

import { useEffect } from "react";
import type { UseFormGetValues } from "react-hook-form";
import {
  type MealItemFormInput,
  mealItemFormSchema,
  type PendingMealItemCollector,
} from "@/components/features/meals/types/meal";

/** Lets the drawer collect input that was typed but not added as a card yet, when it registers or closes */
export const usePendingMealItem = (
  pendingItemRef: React.RefObject<PendingMealItemCollector | null> | undefined,
  getValues: UseFormGetValues<MealItemFormInput>,
) => {
  useEffect(() => {
    if (!pendingItemRef) return;
    pendingItemRef.current = () => {
      const parsed = mealItemFormSchema.safeParse(getValues());
      if (!parsed.success || !parsed.data.name.trim()) return null;
      return parsed.data;
    };
    return () => {
      pendingItemRef.current = null;
    };
  }, [pendingItemRef, getValues]);
};
