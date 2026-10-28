"use client";
// Client because it holds the editable form and the eaten-count stepper

import { NutritionFormFields } from "@/components/features/meals/components/nutrition-form-fields";
import type {
  MealItemFormValues,
  PendingMealItemCollector,
} from "@/components/features/meals/types/meal";
import { OcrPieceCountStepper } from "@/components/features/ocr/components/ocr-piece-count-stepper";
import { useOcrResultForm } from "@/components/features/ocr/hooks/use-ocr-result-form";
import type { OcrNutritionResult } from "@/components/features/ocr/types/ocr";
import { Button } from "@/components/ui/button";

type OcrResultFormProps = {
  ocrResult: OcrNutritionResult;
  onAdd: (values: MealItemFormValues) => void;
  onSaveToMaster: (values: MealItemFormValues) => void;
  /** Lets the drawer detect scanned-but-unadded input at register/close time */
  pendingItemRef?: React.MutableRefObject<PendingMealItemCollector | null>;
};

/** Form pre-filled with OCR results for user correction */
const OcrResultForm = ({
  ocrResult,
  onAdd,
  onSaveToMaster,
  pendingItemRef,
}: OcrResultFormProps) => {
  const {
    register,
    errors,
    canAdd,
    pieceCount,
    eatenCount,
    perPieceCalories,
    handleEatenCountChange,
    handleAdd,
    handleSaveToMaster,
  } = useOcrResultForm({ ocrResult, onAdd, onSaveToMaster, pendingItemRef });

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">
        OCR結果を確認・修正してください
      </p>

      {pieceCount !== null && (
        <OcrPieceCountStepper
          pieceCount={pieceCount}
          perPieceCalories={perPieceCalories}
          eatenCount={eatenCount}
          onEatenCountChange={handleEatenCountChange}
        />
      )}

      <form onSubmit={handleAdd} className="space-y-3">
        <NutritionFormFields
          register={register}
          errors={errors}
          idPrefix="ocr"
        />

        <Button type="submit" className="w-full" disabled={!canAdd}>
          カードに追加
        </Button>
      </form>

      <Button variant="outline" className="w-full" onClick={handleSaveToMaster}>
        食品マスタに保存
      </Button>
    </div>
  );
};

export { OcrResultForm };
