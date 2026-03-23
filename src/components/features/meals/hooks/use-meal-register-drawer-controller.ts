"use client";

import { useAtom, useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { type OcrNutritionResult, useOcr } from "@/components/features/ocr";
import type { SourceType } from "@/types";
import { selectedDateAtom } from "../stores/date-atom";
import {
  draftItemsAtom,
  drawerMealTypeAtom,
  isDrawerOpenAtom,
} from "../stores/meal-register-atom";
import type { MealItemFormValues } from "../types/meal";
import { useRegisterMealItems } from "./use-register-meal-items";

export const useMealRegisterDrawerController = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useAtom(isDrawerOpenAtom);
  const mealType = useAtomValue(drawerMealTypeAtom);
  const [draftItems, setDraftItems] = useAtom(draftItemsAtom);
  const selectedDate = useAtomValue(selectedDateAtom);
  const registerMutation = useRegisterMealItems();
  const [activeTab, setActiveTab] = useState<
    "manual" | "recipe" | "food_master" | "set_menu" | "ocr"
  >("manual");
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrNutritionResult | null>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const { isProcessing: isOcrProcessing, processImage } = useOcr();

  const addDraftItem = useCallback(
    (values: MealItemFormValues, sourceType: SourceType) => {
      setDraftItems((prev) => [
        ...prev,
        {
          ...values,
          tempId: crypto.randomUUID(),
          sourceType,
        },
      ]);
    },
    [setDraftItems],
  );

  const handleManualAdd = useCallback(
    (values: MealItemFormValues) => addDraftItem(values, "manual"),
    [addDraftItem],
  );

  const handleRecipeAdd = useCallback(
    (values: MealItemFormValues) => addDraftItem(values, "recipe"),
    [addDraftItem],
  );

  const handleFoodMasterAdd = useCallback(
    (values: MealItemFormValues) => addDraftItem(values, "food_master"),
    [addDraftItem],
  );

  const handleSetMenuAdd = useCallback(
    (items: MealItemFormValues[]) => {
      setDraftItems((prev) => [
        ...prev,
        ...items.map((values) => ({
          ...values,
          tempId: crypto.randomUUID(),
          sourceType: "set_menu" as SourceType,
        })),
      ]);
      toast.success(`${items.length}件のアイテムを追加しました`);
    },
    [setDraftItems],
  );

  const handleOcrAdd = useCallback(
    (values: MealItemFormValues) => {
      addDraftItem(values, "ocr");
      setOcrResult(null);
    },
    [addDraftItem],
  );

  const handleOcrResult = useCallback((result: OcrNutritionResult) => {
    setOcrResult(result);
  }, []);

  const handleLibraryFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const result = await processImage(file);
      if (result) setOcrResult(result);
      event.target.value = "";
    },
    [processImage],
  );

  const handleSaveToMaster = useCallback(
    (_values: MealItemFormValues) => {
      setIsOpen(false);
      router.push("/other/food-masters/new");
    },
    [router, setIsOpen],
  );

  const handleRemove = useCallback(
    (tempId: string) => {
      setDraftItems((prev) => prev.filter((item) => item.tempId !== tempId));
    },
    [setDraftItems],
  );

  const handleRegister = async () => {
    if (draftItems.length === 0) return;

    try {
      await registerMutation.mutateAsync({
        date: selectedDate,
        mealType,
        items: draftItems,
      });
      toast.success(`${draftItems.length}件の食事を登録しました`);
      setDraftItems([]);
      setIsOpen(false);
    } catch {
      toast.error("登録に失敗しました");
    }
  };

  return {
    activeTab,
    draftItems,
    isOcrOpen,
    isOcrProcessing,
    isOpen,
    libraryInputRef,
    mealType,
    ocrResult,
    registerMutation,
    setActiveTab,
    setIsOcrOpen,
    setIsOpen,
    handleFoodMasterAdd,
    handleLibraryFile,
    handleManualAdd,
    handleOcrAdd,
    handleOcrResult,
    handleRecipeAdd,
    handleRegister,
    handleRemove,
    handleSaveToMaster,
    handleSetMenuAdd,
  };
};
