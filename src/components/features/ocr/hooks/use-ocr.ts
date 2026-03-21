"use client";

import { useCallback, useState } from "react";
import {
  type OcrNutritionResult,
  parseNutritionText,
} from "../utils/ocr-parser";

type OcrState = {
  isProcessing: boolean;
  result: OcrNutritionResult | null;
  error: string | null;
};

/** Hook for OCR processing using Tesseract.js */
export const useOcr = () => {
  const [state, setState] = useState<OcrState>({
    isProcessing: false,
    result: null,
    error: null,
  });

  /** Process an image file through OCR and parse nutrition data */
  const processImage = useCallback(async (imageSource: File | string) => {
    setState({ isProcessing: true, result: null, error: null });

    try {
      // Dynamic import to avoid loading Tesseract.js on initial page load
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("jpn");

      const {
        data: { text },
      } = await worker.recognize(imageSource);
      await worker.terminate();

      const result = parseNutritionText(text);
      setState({ isProcessing: false, result, error: null });
      return result;
    } catch {
      setState({
        isProcessing: false,
        result: null,
        error: "OCR処理に失敗しました",
      });
      return null;
    }
  }, []);

  /** Reset OCR state */
  const reset = useCallback(() => {
    setState({ isProcessing: false, result: null, error: null });
  }, []);

  return {
    ...state,
    processImage,
    reset,
  };
};
