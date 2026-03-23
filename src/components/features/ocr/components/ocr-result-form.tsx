"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { NutritionFormFields } from "@/components/features/meals/components/nutrition-form-fields";
import {
  type MealItemFormInput,
  type MealItemFormValues,
  mealItemFormSchema,
} from "@/components/features/meals/types/meal";
import { Button } from "@/components/ui/button";
import type { OcrNutritionResult } from "../utils/ocr-parser";

type OcrResultFormProps = {
  ocrResult: OcrNutritionResult;
  onAdd: (values: MealItemFormValues) => void;
  onSaveToMaster: (values: MealItemFormValues) => void;
};

/** Form pre-filled with OCR results for user correction */
const OcrResultForm = ({
  ocrResult,
  onAdd,
  onSaveToMaster,
}: OcrResultFormProps) => {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<MealItemFormInput, undefined, MealItemFormValues>({
    resolver: zodResolver(mealItemFormSchema),
    defaultValues: {
      name: ocrResult.name ?? "",
      calories: ocrResult.calories ?? 0,
      protein: ocrResult.protein ?? 0,
      fat: ocrResult.fat ?? 0,
      carbs: ocrResult.carbs ?? 0,
    },
  });

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">
        OCR結果を確認・修正してください
      </p>

      <form onSubmit={handleSubmit(onAdd)} className="space-y-3">
        <NutritionFormFields
          register={register}
          errors={errors}
          idPrefix="ocr"
        />

        <Button type="submit" variant="secondary" className="w-full">
          カードに追加
        </Button>
      </form>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          const values = mealItemFormSchema.parse(getValues());
          onSaveToMaster(values);
        }}
      >
        食品マスタに保存
      </Button>
    </div>
  );
};

export { OcrResultForm };
