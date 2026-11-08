"use client";

import { useAtom } from "jotai";
import { useCallback } from "react";
import { toast } from "sonner";
import { draftItemsAtom } from "@/components/features/meals/stores/meal-register-atom";
import type {
  MealItemDraft,
  MealItemFormValues,
} from "@/components/features/meals/types/meal";
import type { RecentMealItem } from "@/components/features/meals/utils/recent-meal-items";
import type { SourceType } from "@/types";

/** Draft items on the register card, before they are saved */
export const useMealDrafts = () => {
  const [draftItems, setDraftItems] = useAtom(draftItemsAtom);

  const addDraftItem = useCallback(
    (
      values: MealItemFormValues,
      sourceType: SourceType,
      masterIds?: Pick<
        MealItemDraft,
        "foodMasterId" | "recipeId" | "setMenuId"
      >,
    ) => {
      setDraftItems((prev) => [
        ...prev,
        {
          ...values,
          tempId: crypto.randomUUID(),
          sourceType,
          ...masterIds,
        },
      ]);
      // The register card may be below the fold, so confirm the add explicitly
      toast.success(`「${values.name}」を追加しました`);
    },
    [setDraftItems],
  );

  const handleManualAdd = useCallback(
    (values: MealItemFormValues) => addDraftItem(values, "manual"),
    [addDraftItem],
  );

  const handleRecentAdd = useCallback(
    (item: RecentMealItem) =>
      addDraftItem(
        {
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          fat: item.fat,
          carbs: item.carbs,
          cost: item.cost ?? undefined,
        },
        // Preserve the original source and master links
        item.sourceType,
        {
          foodMasterId: item.foodMasterId ?? undefined,
          recipeId: item.recipeId ?? undefined,
          setMenuId: item.setMenuId ?? undefined,
        },
      ),
    [addDraftItem],
  );

  const handleRecipeAdd = useCallback(
    (values: MealItemFormValues, recipeId: string) =>
      addDraftItem(values, "recipe", { recipeId }),
    [addDraftItem],
  );

  const handleFoodMasterAdd = useCallback(
    (values: MealItemFormValues, foodMasterId: string) =>
      addDraftItem(values, "food_master", { foodMasterId }),
    [addDraftItem],
  );

  const handleSetMenuAdd = useCallback(
    (
      items: (MealItemFormValues & {
        setMenuId?: string;
        foodMasterId?: string;
        recipeId?: string;
      })[],
    ) => {
      setDraftItems((prev) => [
        ...prev,
        ...items.map(({ setMenuId, foodMasterId, recipeId, ...values }) => ({
          ...values,
          tempId: crypto.randomUUID(),
          sourceType: "set_menu" as SourceType,
          setMenuId,
          foodMasterId,
          recipeId,
        })),
      ]);
      toast.success(`${items.length}件のアイテムを追加しました`);
    },
    [setDraftItems],
  );

  const handleRemove = useCallback(
    (tempId: string) => {
      setDraftItems((prev) => prev.filter((item) => item.tempId !== tempId));
    },
    [setDraftItems],
  );

  return {
    draftItems,
    setDraftItems,
    addDraftItem,
    lastDraftName: draftItems[draftItems.length - 1]?.name ?? null,
    totalDraftCalories: draftItems.reduce(
      (sum, item) => sum + item.calories,
      0,
    ),
    handleFoodMasterAdd,
    handleManualAdd,
    handleRecentAdd,
    handleRecipeAdd,
    handleRemove,
    handleSetMenuAdd,
  };
};
