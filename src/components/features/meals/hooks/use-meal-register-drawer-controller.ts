"use client";

import { useAtom, useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useDrawerCloseConfirm } from "@/components/features/meals/hooks/use-drawer-close-confirm";
import { useDrawerOcr } from "@/components/features/meals/hooks/use-drawer-ocr";
import { useMealDrafts } from "@/components/features/meals/hooks/use-meal-drafts";
import { useMealRegisterSave } from "@/components/features/meals/hooks/use-meal-register-save";
import {
  drawerMealTypeAtom,
  isDrawerOpenAtom,
} from "@/components/features/meals/stores/meal-register-atom";
import type { RegisterTab } from "@/components/features/meals/types/drawer-candidates";
import type {
  MealItemFormValues,
  PendingFormItem,
  PendingMealItemCollector,
} from "@/components/features/meals/types/meal";
import { useIsShown } from "@/hooks";

export const useMealRegisterDrawerController = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useAtom(isDrawerOpenAtom);
  const mealType = useAtomValue(drawerMealTypeAtom);
  const [activeTab, setActiveTab] = useState<RegisterTab>("manual");
  const manualPendingRef = useRef<PendingMealItemCollector | null>(null);
  const ocrPendingRef = useRef<PendingMealItemCollector | null>(null);

  const drafts = useMealDrafts();
  const { draftItems, setDraftItems, addDraftItem } = drafts;
  const ocr = useDrawerOcr({ addDraftItem });
  const { resetOcr } = ocr;

  /** Close the drawer and reset all transient state so drafts never leak into another meal slot */
  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    setDraftItems([]);
    resetOcr();
    setActiveTab("manual");
  }, [setIsOpen, setDraftItems, resetOcr]);

  // Close the drawer when the home screen is hidden by moving to another tab, so it is not open on return
  const isShown = useIsShown(() => setIsOpen(false));

  /** Collect valid form entries that were typed but never added to the card */
  const collectPendingFormItems = useCallback((): PendingFormItem[] => {
    const pendingItems: PendingFormItem[] = [];
    const manualValues = manualPendingRef.current?.();
    if (manualValues) {
      pendingItems.push({ values: manualValues, sourceType: "manual" });
    }
    const ocrValues = ocrPendingRef.current?.();
    if (ocrValues) {
      pendingItems.push({ values: ocrValues, sourceType: "ocr" });
    }
    return pendingItems;
  }, []);

  const closeConfirm = useDrawerCloseConfirm({
    hasDrafts: draftItems.length > 0,
    collectPendingFormItems,
    closeDrawer,
    setIsOpen,
  });

  const save = useMealRegisterSave({
    draftItems,
    mealType,
    collectPendingFormItems,
    closeDrawer,
    isShown,
  });

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

  return {
    activeTab,
    isOpen,
    manualPendingRef,
    mealType,
    ocrPendingRef,
    setActiveTab,
    handleSaveToMaster,
    draftItems: drafts.draftItems,
    lastDraftName: drafts.lastDraftName,
    totalDraftCalories: drafts.totalDraftCalories,
    handleFoodMasterAdd: drafts.handleFoodMasterAdd,
    handleManualAdd: drafts.handleManualAdd,
    handleRecentAdd: drafts.handleRecentAdd,
    handleRecipeAdd: drafts.handleRecipeAdd,
    handleRemove: drafts.handleRemove,
    handleSetMenuAdd: drafts.handleSetMenuAdd,
    isOcrOpen: ocr.isOcrOpen,
    isOcrProcessing: ocr.isOcrProcessing,
    libraryInputRef: ocr.libraryInputRef,
    ocrError: ocr.ocrError,
    ocrResult: ocr.ocrResult,
    setIsOcrOpen: ocr.setIsOcrOpen,
    openOcrCamera: ocr.openOcrCamera,
    closeOcrCamera: ocr.closeOcrCamera,
    openLibraryPicker: ocr.openLibraryPicker,
    handleLibraryFile: ocr.handleLibraryFile,
    handleOcrAdd: ocr.handleOcrAdd,
    handleOcrResult: ocr.handleOcrResult,
    isDiscardConfirmOpen: closeConfirm.isDiscardConfirmOpen,
    setIsDiscardConfirmOpen: closeConfirm.setIsDiscardConfirmOpen,
    handleOpenChange: closeConfirm.handleOpenChange,
    handleDiscardDrafts: closeConfirm.handleDiscardDrafts,
    isRegistering: save.isRegistering,
    pendingNames: save.pendingNames,
    pendingRegisterItems: save.pendingRegisterItems,
    setPendingRegisterItems: save.setPendingRegisterItems,
    handlePendingDialogOpenChange: save.handlePendingDialogOpenChange,
    handleRegister: save.handleRegister,
    handleRegisterWithPending: save.handleRegisterWithPending,
    handleRegisterWithoutPending: save.handleRegisterWithoutPending,
  };
};
