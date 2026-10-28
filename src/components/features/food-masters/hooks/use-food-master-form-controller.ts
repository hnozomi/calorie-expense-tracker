"use client";
// Client because it holds the form state and calls Server Actions from the browser

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  deleteFoodMaster,
  saveFoodMaster,
} from "@/components/features/food-masters/api/actions";
import type {
  FoodMaster,
  FoodMasterFormInput,
  FoodMasterFormValues,
} from "@/components/features/food-masters/types/food-master";
import { foodMasterFormSchema } from "@/components/features/food-masters/types/food-master";
import type { OcrNutritionResult } from "@/components/features/ocr";
import { useUnsavedChangesGuard } from "@/hooks";
import { callAction } from "@/lib/action-result";
import { FOOD_CATEGORIES, type FoodCategory } from "@/types";

const EMPTY_FOOD_MASTER_FORM_VALUES: FoodMasterFormValues = {
  name: "",
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
};

const toFoodMasterFormValues = (
  foodMaster: FoodMaster,
): FoodMasterFormValues => ({
  name: foodMaster.name,
  brand: foodMaster.brand ?? undefined,
  category: foodMaster.category ?? undefined,
  calories: foodMaster.calories,
  protein: foodMaster.protein,
  fat: foodMaster.fat,
  carbs: foodMaster.carbs,
  defaultPrice: foodMaster.defaultPrice ?? undefined,
  notes: foodMaster.notes ?? undefined,
});

/** existing is read on the server (undefined on the new screen); prefill carries values passed in the URL, such as an OCR result */
export const useFoodMasterFormController = (
  existing: FoodMaster | undefined,
  prefill: Partial<FoodMasterFormValues>,
) => {
  const router = useRouter();
  const isNew = existing === undefined;
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);

  const form = useForm<FoodMasterFormInput, undefined, FoodMasterFormValues>({
    resolver: zodResolver(foodMasterFormSchema),
    // Initial values go in once: the screen stays mounted (hidden) after moving to another tab, and an effect
    // that reset the form would run again on return and throw away what was being typed
    defaultValues: existing
      ? toFoodMasterFormValues(existing)
      : { ...EMPTY_FOOD_MASTER_FORM_VALUES, ...prefill },
  });

  const handleOcrResult = useCallback(
    (result: OcrNutritionResult) => {
      const ocrSetOptions = { shouldValidate: true, shouldDirty: true };
      if (result.name) {
        form.setValue("name", result.name, ocrSetOptions);
      }
      if (result.calories != null) {
        form.setValue("calories", result.calories, ocrSetOptions);
      }
      if (result.protein != null) {
        form.setValue("protein", result.protein, ocrSetOptions);
      }
      if (result.fat != null) {
        form.setValue("fat", result.fat, ocrSetOptions);
      }
      if (result.carbs != null) {
        form.setValue("carbs", result.carbs, ocrSetOptions);
      }
      toast.success("OCR結果を反映しました");
    },
    [form],
  );

  // The action returns a result instead of redirecting: a redirect ends the call with an exception on the
  // client, so the success toast could not be shown. The list is re-read by the action, so moving is enough
  const handleSave = form.handleSubmit((values) => {
    startSaving(async () => {
      const result = await callAction(() =>
        saveFoodMaster({ id: existing?.id, values }),
      );
      if (!result.ok) {
        toast.error("保存に失敗しました");
        return;
      }
      toast.success(isNew ? "食品を登録しました" : "変更を保存しました");
      // A new master's screen starts empty again; an edited one keeps the saved values as its clean state
      form.reset(isNew ? undefined : values);
      router.push("/other/food-masters");
    });
  });

  const handleDelete = () => {
    if (!existing) return;
    startDeleting(async () => {
      const result = await callAction(() =>
        deleteFoodMaster({ id: existing.id }),
      );
      if (!result.ok) {
        toast.error("削除に失敗しました");
        return;
      }
      toast.success("食品を削除しました");
      router.push("/other/food-masters");
    });
  };

  // Leaving with unsaved edits asks first (back button and the header's back arrow)
  // The screen stays mounted (hidden) after leaving, so discarded input would still be there when it is
  // opened again; put the form back to its initial values on the way out
  const backGuard = useUnsavedChangesGuard(form.formState.isDirty, () => {
    form.reset();
    router.push("/other/food-masters");
  });

  return {
    form,
    backGuard,
    categoryValue: form.watch("category"),
    existing,
    hasUnsavedChanges: form.formState.isDirty,
    isDeleteConfirmOpen,
    isDeleting,
    isNew,
    isOcrOpen,
    isSaving,
    setIsDeleteConfirmOpen,
    openDeleteConfirm: () => setIsDeleteConfirmOpen(true),
    closeDeleteConfirm: () => setIsDeleteConfirmOpen(false),
    setIsOcrOpen,
    openOcr: () => setIsOcrOpen(true),
    closeOcr: () => setIsOcrOpen(false),
    // The select hands back a plain string; only a known category is written to the form
    handleCategoryChange: (value: string) => {
      const category = FOOD_CATEGORIES.find((known) => known === value);
      if (category)
        form.setValue("category", category as FoodCategory, {
          shouldValidate: true,
        });
    },
    handleDelete,
    handleOcrResult,
    handleSave,
  };
};
