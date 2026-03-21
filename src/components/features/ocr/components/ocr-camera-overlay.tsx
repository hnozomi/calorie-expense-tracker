"use client";

import { Camera, ImageIcon, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useOcr } from "../hooks/use-ocr";
import type { OcrNutritionResult } from "../utils/ocr-parser";

type OcrCameraOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  onResult: (result: OcrNutritionResult) => void;
};

/** Full-screen overlay for capturing nutrition labels via camera or file */
const OcrCameraOverlay = ({
  isOpen,
  onClose,
  onResult,
}: OcrCameraOverlayProps) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isProcessing, error, processImage } = useOcr();

  /** Handle file selection from either input and process via OCR */
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await processImage(file);
    if (result) {
      onResult(result);
      onClose();
    }
    // Reset input so the same file can be selected again
    event.target.value = "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h2 className="font-semibold">栄養表を撮影</h2>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        {isProcessing ? (
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="text-sm text-muted-foreground">OCR解析中...</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <Camera className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                食品の栄養成分表示を撮影してください
              </p>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              size="lg"
              className="w-full max-w-xs"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="mr-2 h-5 w-5" />
              撮影する
            </Button>

            <Button
              variant="outline"
              className="w-full max-w-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="mr-2 h-5 w-5" />
              ライブラリから選択
            </Button>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
};

export { OcrCameraOverlay };
