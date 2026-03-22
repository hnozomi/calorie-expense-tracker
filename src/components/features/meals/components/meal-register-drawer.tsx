"use client";

import { useAtom, useAtomValue } from "jotai";
import { BookOpen, Camera, Database, PenLine } from "lucide-react";
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
import { RecipeSelector } from "./recipe-selector";

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

  const handleRecipeAdd = useCallback(
    (values: MealItemFormValues) => addDraftItem(values, "recipe"),
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
          <SheetHeader className="pb-2">
            <SheetTitle className="text-lg">
              {MEAL_TYPE_LABELS[mealType]}を登録
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 py-2">
            <Tabs defaultValue="manual">
              <TabsList className="h-auto w-full gap-1 bg-muted/60 p-1">
                <TabsTrigger
                  value="manual"
                  className="flex flex-1 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <PenLine className="h-4 w-4" />
                  手動
                </TabsTrigger>
                <TabsTrigger
                  value="recipe"
                  className="flex flex-1 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <BookOpen className="h-4 w-4" />
                  レシピ
                </TabsTrigger>
                <TabsTrigger
                  value="food_master"
                  className="flex flex-1 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Database className="h-4 w-4" />
                  マスタ
                </TabsTrigger>
                <TabsTrigger
                  value="ocr"
                  className="flex flex-1 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Camera className="h-4 w-4" />
                  OCR
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="mt-4">
                <ManualInputForm onAdd={handleManualAdd} />
              </TabsContent>

              <TabsContent value="recipe" className="mt-4">
                <RecipeSelector onSelect={handleRecipeAdd} />
              </TabsContent>

              <TabsContent value="food_master" className="mt-4">
                <FoodMasterSelector onSelect={handleFoodMasterAdd} />
              </TabsContent>

              <TabsContent value="ocr" className="mt-4">
                {ocrResult ? (
                  <OcrResultForm
                    ocrResult={ocrResult}
                    onAdd={handleOcrAdd}
                    onSaveToMaster={handleSaveToMaster}
                  />
                ) : (
                  <div className="rounded-lg border border-dashed border-muted-foreground/25 py-6 text-center">
                    <Camera className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
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
