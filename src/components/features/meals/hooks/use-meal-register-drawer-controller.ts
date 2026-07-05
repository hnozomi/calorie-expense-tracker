"use client";

import { useAtom, useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  hasOcrValues,
  type OcrNutritionResult,
  useOcr,
} from "@/components/features/ocr";
import type { SourceType } from "@/types";
import { selectedDateAtom } from "../stores/date-atom";
import {
  draftItemsAtom,
  drawerMealTypeAtom,
  isDrawerOpenAtom,
} from "../stores/meal-register-atom";
import type { MealItemDraft, MealItemFormValues } from "../types/meal";
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
  const [ocrNoValueError, setOcrNoValueError] = useState<string | null>(null);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const {
    isProcessing: isOcrProcessing,
    error: ocrProcessError,
    processImage,
  } = useOcr();

  /** Close the drawer and reset all transient state so drafts never leak into another meal slot */
  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    setDraftItems([]);
    setOcrResult(null);
    setOcrNoValueError(null);
    setActiveTab("manual");
  }, [setIsOpen, setDraftItems]);

  /** Intercept drawer close: ask for confirmation when unsaved drafts exist */
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setIsOpen(true);
        return;
      }
      if (draftItems.length > 0) {
        setIsDiscardConfirmOpen(true);
        return;
      }
      closeDrawer();
    },
    [draftItems.length, closeDrawer, setIsOpen],
  );

  /** Discard unsaved drafts and close the drawer */
  const handleDiscardDrafts = useCallback(() => {
    setIsDiscardConfirmOpen(false);
    closeDrawer();
  }, [closeDrawer]);

  const addDraftItem = useCallback(
    (
      values: MealItemFormValues,
      sourceType: SourceType,
      masterIds?: Pick<
        MealItemDraft,
        "foodMasterId" | "recipeId" | "setMenuId"
      >,
    ) => {
      setDraftItems((prev) => [
        ...prev,
        {
          ...values,
          tempId: crypto.randomUUID(),
          sourceType,
          ...masterIds,
        },
      ]);
      // The register card may be below the fold, so confirm the add explicitly
      toast.success(`「${values.name}」を追加しました`);
    },
    [setDraftItems],
  );

  const handleManualAdd = useCallback(
    (values: MealItemFormValues) => addDraftItem(values, "manual"),
    [addDraftItem],
  );

  const handleRecipeAdd = useCallback(
    (values: MealItemFormValues, recipeId: string) =>
      addDraftItem(values, "recipe", { recipeId }),
    [addDraftItem],
  );

  const handleFoodMasterAdd = useCallback(
    (values: MealItemFormValues, foodMasterId: string) =>
      addDraftItem(values, "food_master", { foodMasterId }),
    [addDraftItem],
  );

  const handleSetMenuAdd = useCallback(
    (
      items: (MealItemFormValues & {
        setMenuId?: string;
        foodMasterId?: string;
        recipeId?: string;
      })[],
    ) => {
      setDraftItems((prev) => [
        ...prev,
        ...items.map(({ setMenuId, foodMasterId, recipeId, ...values }) => ({
          ...values,
          tempId: crypto.randomUUID(),
          sourceType: "set_menu" as SourceType,
          setMenuId,
          foodMasterId,
          recipeId,
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

  const handleSaveToMaster = useCallback(
    (values: MealItemFormValues) => {
      // Carry the scanned/corrected values into the new food master form
      const prefillParams = new URLSearchParams({
        name: values.name,
        calories: String(values.calories),
        protein: String(values.protein),
        fat: String(values.fat),
        carbs: String(values.carbs),
      });
      if (values.cost != null) {
        prefillParams.set("defaultPrice", String(values.cost));
      }
      closeDrawer();
      router.push(`/other/food-masters/new?${prefillParams.toString()}`);
    },
    [router, closeDrawer],
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
      closeDrawer();
    } catch {
      toast.error("登録に失敗しました");
    }
  };

  return {
    activeTab,
    draftItems,
    isDiscardConfirmOpen,
    isOcrOpen,
    isOcrProcessing,
    isOpen,
    libraryInputRef,
    mealType,
    ocrError: ocrProcessError ?? ocrNoValueError,
    ocrResult,
    registerMutation,
    setActiveTab,
    setIsDiscardConfirmOpen,
    setIsOcrOpen,
    handleDiscardDrafts,
    handleFoodMasterAdd,
    handleLibraryFile,
    handleManualAdd,
    handleOcrAdd,
    handleOcrResult,
    handleOpenChange,
    handleRecipeAdd,
    handleRegister,
    handleRemove,
    handleSaveToMaster,
    handleSetMenuAdd,
  };
};
