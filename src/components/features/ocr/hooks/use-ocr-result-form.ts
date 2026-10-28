"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  type MealItemFormInput,
  type MealItemFormValues,
  mealItemFormSchema,
  type PendingMealItemCollector,
} from "@/components/features/meals/types/meal";
import type { OcrNutritionResult } from "@/components/features/ocr/types/ocr";
import {
  ocrNutrition,
  scaleNutrition,
} from "@/components/features/ocr/utils/scale-nutrition";

type Params = {
  ocrResult: OcrNutritionResult;
  onAdd: (values: MealItemFormValues) => void;
  onSaveToMaster: (values: MealItemFormValues) => void;
  pendingItemRef?: React.MutableRefObject<PendingMealItemCollector | null>;
};

/** Form state for the scanned values, multiplied by how many pieces were eaten when the label is per piece */
export const useOcrResultForm = ({
  ocrResult,
  onAdd,
  onSaveToMaster,
  pendingItemRef,
}: Params) => {
  const pieceCount = ocrResult.pieceCount;
  // A per-piece label most often means the whole pack was eaten
  const [eatenCount, setEatenCount] = useState(pieceCount ?? 1);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MealItemFormInput, undefined, MealItemFormValues>({
    resolver: zodResolver(mealItemFormSchema),
    defaultValues: {
      name: ocrResult.name ?? "",
      ...scaleNutrition(ocrNutrition(ocrResult), eatenCount),
    },
  });

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

  const nameValue = watch("name");
  const canAdd = typeof nameValue === "string" && nameValue.trim().length > 0;

  /** Change the eaten count and refill the nutrition fields from the per-piece values on the label */
  const handleEatenCountChange = (count: number) => {
    setEatenCount(count);
    const scaled = scaleNutrition(ocrNutrition(ocrResult), count);
    setValue("calories", scaled.calories);
    setValue("protein", scaled.protein);
    setValue("fat", scaled.fat);
    setValue("carbs", scaled.carbs);
  };

  /** Add the corrected values and close the soft keyboard so the card is visible */
  const handleAdd = handleSubmit((values) => {
    onAdd(values);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  /** A food master holds one piece, so the eaten amount and its cost are divided back by the count */
  const handleSaveToMaster = () => {
    const values = mealItemFormSchema.parse(getValues());
    onSaveToMaster({
      ...scaleNutrition(values, 1 / eatenCount),
      cost:
        values.cost === undefined
          ? undefined
          : Math.round(values.cost / eatenCount),
    });
  };

  return {
    register,
    errors,
    canAdd,
    pieceCount,
    eatenCount,
    perPieceCalories: ocrResult.calories,
    handleEatenCountChange,
    handleAdd,
    handleSaveToMaster,
  };
};
