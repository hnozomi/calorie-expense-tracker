"use client";

import { useCallback, useState } from "react";
import { readNutritionLabel } from "@/components/features/ocr/api/actions";
import type {
  OcrFailureReason,
  OcrNutritionResult,
} from "@/components/features/ocr/types/ocr";
import { resizeImageToDataUrl } from "@/components/features/ocr/utils/resize-image";

type OcrState = {
  isProcessing: boolean;
  result: OcrNutritionResult | null;
  error: string | null;
};

const ERROR_MESSAGES: Record<OcrFailureReason, string> = {
  limit: "今日の読み取り回数の上限に達しました。手動タブで入力してください",
  failed: "読み取りに失敗しました。時間をおいてもう一度試してください",
};

/** Hook that shrinks a photo and has the server read its nutrition values */
export const useOcr = () => {
  const [state, setState] = useState<OcrState>({
    isProcessing: false,
    result: null,
    error: null,
  });

  const processImage = useCallback(async (file: File) => {
    setState({ isProcessing: true, result: null, error: null });

    let reason: OcrFailureReason = "failed";
    try {
      const imageDataUrl = await resizeImageToDataUrl(file);
      const response = await readNutritionLabel(imageDataUrl);
      if (response.ok) {
        setState({ isProcessing: false, result: response.result, error: null });
        return response.result;
      }
      reason = response.reason;
    } catch {
      // The image could not be decoded, or the action call itself failed (offline, a stale tab after a deploy)
    }
    setState({
      isProcessing: false,
      result: null,
      error: ERROR_MESSAGES[reason],
    });
    return null;
  }, []);

  const reset = useCallback(() => {
    setState({ isProcessing: false, result: null, error: null });
  }, []);

  return {
    ...state,
    processImage,
    reset,
  };
};
