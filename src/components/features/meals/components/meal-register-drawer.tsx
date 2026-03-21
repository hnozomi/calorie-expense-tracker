"use client";

import { useAtom, useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  OcrCameraOverlay,
  type OcrNutritionResult,
  OcrResultForm,
} from "@/components/features/ocr";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MEAL_TYPE_LABELS, type SourceType } from "@/types";
import { useRegisterMealItems } from "../hooks/use-register-meal-items";
import { selectedDateAtom } from "../stores/date-atom";
import {
  draftItemsAtom,
  drawerMealTypeAtom,
  isDrawerOpenAtom,
} from "../stores/meal-register-atom";
import type { MealItemFormValues } from "../types/meal";
import { FoodMasterSelector } from "./food-master-selector";
import { ManualInputForm } from "./manual-input-form";
import { MealRegisterCard } from "./meal-register-card";

/** Bottom sheet drawer for adding meal items and batch registering */
const MealRegisterDrawer = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useAtom(isDrawerOpenAtom);
  const mealType = useAtomValue(drawerMealTypeAtom);
  const [draftItems, setDraftItems] = useAtom(draftItemsAtom);
  const selectedDate = useAtomValue(selectedDateAtom);
  const registerMutation = useRegisterMealItems();
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrNutritionResult | null>(null);

  /** Add a draft item with the given source type */
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

  const handleFoodMasterAdd = useCallback(
    (values: MealItemFormValues) => addDraftItem(values, "food_master"),
    [addDraftItem],
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

  /** Navigate to food master form with OCR values pre-filled */
  const handleSaveToMaster = useCallback(
    (_values: MealItemFormValues) => {
      // Close drawer and navigate to food master creation
      setIsOpen(false);
      router.push("/other/food-masters/new");
    },
    [setIsOpen, router],
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

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{MEAL_TYPE_LABELS[mealType]}を登録</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 py-4">
            <Tabs defaultValue="manual">
              <TabsList className="w-full">
                <TabsTrigger value="manual" className="flex-1">
                  手動
                </TabsTrigger>
                <TabsTrigger value="food_master" className="flex-1">
                  マスタ
                </TabsTrigger>
                <TabsTrigger value="ocr" className="flex-1">
                  OCR
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="mt-3">
                <ManualInputForm onAdd={handleManualAdd} />
              </TabsContent>

              <TabsContent value="food_master" className="mt-3">
                <FoodMasterSelector onSelect={handleFoodMasterAdd} />
              </TabsContent>

              <TabsContent value="ocr" className="mt-3">
                {ocrResult ? (
                  <OcrResultForm
                    ocrResult={ocrResult}
                    onAdd={handleOcrAdd}
                    onSaveToMaster={handleSaveToMaster}
                  />
                ) : (
                  <div className="py-4 text-center">
                    <p className="mb-3 text-sm text-muted-foreground">
                      栄養成分表示を撮影して自動入力
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsOcrOpen(true)}
                    >
                      カメラを起動
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <MealRegisterCard items={draftItems} onRemove={handleRemove} />

            <Button
              className="w-full"
              disabled={draftItems.length === 0 || registerMutation.isPending}
              onClick={handleRegister}
            >
              {registerMutation.isPending
                ? "登録中..."
                : `${draftItems.length}件まとめて登録する`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <OcrCameraOverlay
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onResult={handleOcrResult}
      />
    </>
  );
};

export { MealRegisterDrawer };
