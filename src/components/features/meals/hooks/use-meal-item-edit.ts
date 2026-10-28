"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { callAction } from "@/lib/action-result";
import { deleteMealItem, updateMealItem } from "../api/actions";
import {
  type MealItem,
  type MealItemFormInput,
  type MealItemFormValues,
  mealItemFormSchema,
} from "../types/meal";
import { useDailyMealsContext } from "./use-daily-meals-context";

/** Edit or delete one meal item. The drawer closes at once and the slot shows the change while it is saved;
 *  when saving fails, onSaveFailed reopens it with the typed values so nothing has to be typed again */
export const useMealItemEdit = (
  item: MealItem | null,
  onClose: () => void,
  onSaveFailed: (itemWithTypedValues: MealItem) => void,
) => {
  const { showMealChange } = useDailyMealsContext();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const form = useForm<MealItemFormInput, undefined, MealItemFormValues>({
    resolver: zodResolver(mealItemFormSchema),
    values: item
      ? {
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          fat: item.fat,
          carbs: item.carbs,
          cost: item.cost ?? undefined,
        }
      : undefined,
  });

  const handleSave = (values: MealItemFormValues) => {
    if (!item) return;
    // The drawer closes (and remounts with the next item), so the save runs in a transition not owned by it
    onClose();
    startTransition(async () => {
      showMealChange({ type: "update", itemId: item.id, values });
      const result = await callAction(() =>
        updateMealItem({ itemId: item.id, values }),
      );
      if (!result.ok) {
        toast.error(`「${item.name}」の更新に失敗しました`);
        onSaveFailed({ ...item, ...values, cost: values.cost ?? null });
        return;
      }
      toast.success("変更を保存しました");
    });
  };

  const handleDelete = () => {
    if (!item) return;
    setIsDeleteConfirmOpen(false);
    onClose();
    startTransition(async () => {
      showMealChange({ type: "remove", itemId: item.id });
      const result = await callAction(() =>
        deleteMealItem({ itemId: item.id }),
      );
      if (!result.ok) {
        toast.error(`「${item.name}」の削除に失敗しました`);
        return;
      }
      toast.success("削除しました");
    });
  };

  return {
    form,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    openDeleteConfirm: () => setIsDeleteConfirmOpen(true),
    closeDeleteConfirm: () => setIsDeleteConfirmOpen(false),
    handleOpenChange: (open: boolean) => {
      if (!open) onClose();
    },
    handleSave,
    handleDelete,
  };
};
