"use client";

import { useSetAtom } from "jotai";
import { useLayoutEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { callAction } from "@/lib/action-result";
import { useRefreshLegacyScreens } from "@/lib/legacy-bridge";
import { MEAL_TYPE_LABELS, type MealType } from "@/types";
import { copyPreviousDayMeal, transferMealToPlan } from "../api/actions";
import {
  drawerMealTypeAtom,
  isDrawerOpenAtom,
} from "../stores/meal-register-atom";
import type { DisplayedMealItem, MealItem } from "../types/meal";
import { useDailyMealsContext } from "./use-daily-meals-context";

/** One meal slot: open the drawer for it, copy the previous day, add it to the plan, edit an item */
export const useMealSlot = (mealType: MealType, items: DisplayedMealItem[]) => {
  const { date } = useDailyMealsContext();
  const setIsDrawerOpen = useSetAtom(isDrawerOpenAtom);
  const setDrawerMealType = useSetAtom(drawerMealTypeAtom);
  const refreshLegacyScreens = useRefreshLegacyScreens();
  const [editingItem, setEditingItem] = useState<MealItem | null>(null);
  const [isCopying, startCopy] = useTransition();
  const [isTransferring, startTransfer] = useTransition();
  const label = MEAL_TYPE_LABELS[mealType];

  // The home screen stays mounted (hidden) after moving to another tab; close the edit drawer so it is not open on return
  useLayoutEffect(() => () => setEditingItem(null), []);

  const openDrawer = () => {
    setDrawerMealType(mealType);
    setIsDrawerOpen(true);
  };

  const handleCopyPreviousDay = () => {
    startCopy(async () => {
      const result = await callAction(() =>
        copyPreviousDayMeal({ date, mealType }),
      );
      if (!result.ok) {
        toast.error("コピーに失敗しました");
        return;
      }
      if (result.copiedCount === 0) {
        toast.info(`前日の${label}の記録がありません`);
        return;
      }
      toast.success(`前日の${label}(${result.copiedCount}件)をコピーしました`);
      refreshLegacyScreens();
    });
  };

  const handleTransferToPlan = () => {
    startTransfer(async () => {
      const result = await callAction(() =>
        transferMealToPlan({ date, mealType }),
      );
      if (!result.ok) {
        toast.error("献立への反映に失敗しました");
        return;
      }
      toast.success("献立に反映しました");
      refreshLegacyScreens();
    });
  };

  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);

  return {
    editingItem,
    isCopying,
    isTransferring,
    totalCalories,
    openDrawer,
    handleCopyPreviousDay,
    handleTransferToPlan,
    startEditing: setEditingItem,
    stopEditing: () => setEditingItem(null),
  };
};
