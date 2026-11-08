"use client";

import { useCallback, useRef, useState } from "react";
import type { MealItemFormValues } from "@/components/features/meals/types/meal";
import {
  hasOcrValues,
  type OcrNutritionResult,
  useOcr,
} from "@/components/features/ocr";
import type { SourceType } from "@/types";

type Params = {
  addDraftItem: (values: MealItemFormValues, sourceType: SourceType) => void;
};

/** The OCR tab of the register drawer: the camera, the library picker and the scanned result */
export const useDrawerOcr = ({ addDraftItem }: Params) => {
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrNutritionResult | null>(null);
  const [ocrNoValueError, setOcrNoValueError] = useState<string | null>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const {
    isProcessing: isOcrProcessing,
    error: ocrProcessError,
    processImage,
  } = useOcr();

  const resetOcr = useCallback(() => {
    setOcrResult(null);
    setOcrNoValueError(null);
  }, []);

  const handleOcrAdd = useCallback(
    (values: MealItemFormValues) => {
      addDraftItem(values, "ocr");
      setOcrResult(null);
    },
    [addDraftItem],
  );

  const handleOcrResult = useCallback((result: OcrNutritionResult) => {
    setOcrNoValueError(null);
    setOcrResult(result);
  }, []);

  const handleLibraryFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setOcrNoValueError(null);
      const result = await processImage(file);
      if (result && hasOcrValues(result)) {
        setOcrResult(result);
      } else if (result) {
        // Parsed but every field came back empty
        setOcrNoValueError(
          "栄養成分を読み取れませんでした。ラベル全体が写る画像を選ぶか、手動タブで入力してください",
        );
      }
      event.target.value = "";
    },
    [processImage],
  );

  return {
    isOcrOpen,
    isOcrProcessing,
    libraryInputRef,
    ocrError: ocrProcessError ?? ocrNoValueError,
    ocrResult,
    setIsOcrOpen,
    openOcrCamera: () => setIsOcrOpen(true),
    closeOcrCamera: () => setIsOcrOpen(false),
    openLibraryPicker: () => libraryInputRef.current?.click(),
    resetOcr,
    handleLibraryFile,
    handleOcrAdd,
    handleOcrResult,
  };
};
