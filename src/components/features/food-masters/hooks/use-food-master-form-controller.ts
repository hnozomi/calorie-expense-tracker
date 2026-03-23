"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { OcrNutritionResult } from "@/components/features/ocr";
import type {
  FoodMaster,
  FoodMasterFormInput,
  FoodMasterFormValues,
} from "../types/food-master";
import { foodMasterFormSchema } from "../types/food-master";
import { useDeleteFoodMaster } from "./use-delete-food-master";
import { useFoodMasterDetail } from "./use-food-master-detail";
import { useSaveFoodMaster } from "./use-save-food-master";

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

export const useFoodMasterFormController = (id: string) => {
  const router = useRouter();
  const isNew = id === "new";
  const { data: existing, isLoading } = useFoodMasterDetail(
    isNew ? undefined : id,
  );
  const saveMutation = useSaveFoodMaster();
  const deleteMutation = useDeleteFoodMaster();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);

  const form = useForm<FoodMasterFormInput, undefined, FoodMasterFormValues>({
    resolver: zodResolver(foodMasterFormSchema),
    defaultValues: EMPTY_FOOD_MASTER_FORM_VALUES,
  });

  useEffect(() => {
    if (!existing) {
      form.reset(EMPTY_FOOD_MASTER_FORM_VALUES);
      return;
    }

    form.reset(toFoodMasterFormValues(existing));
  }, [existing, form]);

  const handleOcrResult = useCallback(
    (result: OcrNutritionResult) => {
      if (result.name) {
        form.setValue("name", result.name, { shouldValidate: true });
      }
      if (result.calories != null) {
        form.setValue("calories", result.calories, { shouldValidate: true });
      }
      if (result.protein != null) {
        form.setValue("protein", result.protein, { shouldValidate: true });
      }
      if (result.fat != null) {
        form.setValue("fat", result.fat, { shouldValidate: true });
      }
      if (result.carbs != null) {
        form.setValue("carbs", result.carbs, { shouldValidate: true });
      }
      toast.success("OCR結果を反映しました");
    },
    [form],
  );

  const handleSave = form.handleSubmit(async (values) => {
    try {
      await saveMutation.mutateAsync({
        id: isNew ? undefined : id,
        values,
      });
      toast.success(isNew ? "食品を登録しました" : "変更を保存しました");
      router.push("/other/food-masters");
    } catch {
      toast.error("保存に失敗しました");
    }
  });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("食品を削除しました");
      router.push("/other/food-masters");
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  return {
    form,
    existing,
    isDeleteConfirmOpen,
    isLoading,
    isNew,
    isOcrOpen,
    deleteMutation,
    saveMutation,
    setIsDeleteConfirmOpen,
    setIsOcrOpen,
    handleDelete,
    handleOcrResult,
    handleSave,
  };
};
