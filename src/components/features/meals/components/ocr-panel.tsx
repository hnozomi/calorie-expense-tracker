"use client";
// Client because it picks an image and shows the OCR result form

import { Camera, ImageIcon } from "lucide-react";
import {
  type OcrNutritionResult,
  OcrResultForm,
} from "@/components/features/ocr";
import { Button } from "@/components/ui/button";
import type {
  MealItemFormValues,
  PendingMealItemCollector,
} from "../types/meal";

type Props = {
  ocrResult: OcrNutritionResult | null;
  isProcessing: boolean;
  error: string | null;
  libraryInputRef: React.RefObject<HTMLInputElement | null>;
  pendingItemRef: React.RefObject<PendingMealItemCollector | null>;
  onOpenCamera: () => void;
  onOpenLibrary: () => void;
  onLibraryFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAdd: (values: MealItemFormValues) => void;
  onSaveToMaster: (values: MealItemFormValues) => void;
};

export const OcrPanel = ({
  ocrResult,
  isProcessing,
  error,
  libraryInputRef,
  pendingItemRef,
  onOpenCamera,
  onOpenLibrary,
  onLibraryFile,
  onAdd,
  onSaveToMaster,
}: Props) => {
  if (ocrResult) {
    return (
      <OcrResultForm
        // Remount when a new scan arrives so defaultValues refresh,
        // while user corrections survive tab switches
        key={JSON.stringify(ocrResult)}
        ocrResult={ocrResult}
        onAdd={onAdd}
        onSaveToMaster={onSaveToMaster}
        pendingItemRef={pendingItemRef}
      />
    );
  }

  if (isProcessing) {
    return (
      <div className="py-10 text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">OCR解析中...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-muted-foreground/25 py-6 text-center">
      <Camera className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
      <p className="mb-3 text-sm text-muted-foreground">
        栄養成分表示を撮影して自動入力
      </p>
      <div className="flex flex-col items-center gap-2">
        <Button variant="outline" onClick={onOpenCamera}>
          <Camera className="mr-1.5 size-4" />
          カメラを起動
        </Button>
        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onLibraryFile}
        />
        <Button variant="ghost" onClick={onOpenLibrary}>
          <ImageIcon className="mr-1.5 size-4" />
          ライブラリから選択
        </Button>
      </div>
      {error && <p className="mt-3 px-4 text-sm text-destructive">{error}</p>}
    </div>
  );
};
