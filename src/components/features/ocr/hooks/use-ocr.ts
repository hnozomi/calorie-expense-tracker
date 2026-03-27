"use client";

import { useCallback, useState } from "react";
import {
  type OcrNutritionResult,
  parseNutritionText,
} from "../utils/ocr-parser";
import { preprocessImage } from "../utils/ocr-preprocess";

type OcrState = {
  isProcessing: boolean;
  result: OcrNutritionResult | null;
  error: string | null;
};

/** Hook for OCR processing with image preprocessing and Tesseract.js */
export const useOcr = () => {
  const [state, setState] = useState<OcrState>({
    isProcessing: false,
    result: null,
    error: null,
  });

  /** Preprocess image, then run Tesseract OCR and parse nutrition data */
  const processImage = useCallback(async (imageSource: File | string) => {
    setState({ isProcessing: true, result: null, error: null });

    try {
      // Preprocess: grayscale, contrast, binarization, upscale
      const preprocessedDataUrl = await preprocessImage(imageSource);

      // Dynamic import to avoid loading Tesseract.js on initial page load
      const { createWorker, PSM } = await import("tesseract.js");
      const worker = await createWorker("jpn+eng");

      // PSM SINGLE_BLOCK: Assume a single uniform block of text (best for nutrition labels)
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });

      const {
        data: { text },
      } = await worker.recognize(preprocessedDataUrl);
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
