"use client";

import { useAtom, useAtomValue } from "jotai";
import { BookOpen, Camera, Database, ListChecks, PenLine } from "lucide-react";
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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { MEAL_TYPE_LABELS, type SourceType } from "@/types";
import { cn } from "@/utils";
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
import { SetMenuSelector } from "./set-menu-selector";

/** Bottom drawer for adding meal items and batch registering */
const MealRegisterDrawer = () => {
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

  /** Add all items from a set menu as individual draft items */
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

  /** Navigate to food master form with OCR values pre-filled */
  const handleSaveToMaster = useCallback(
    (_values: MealItemFormValues) => {
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
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-base">
              {MEAL_TYPE_LABELS[mealType]}を登録
            </DrawerTitle>
          </DrawerHeader>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* Tab bar */}
            <div
              className="flex gap-1 rounded-xl bg-muted/50 p-1"
              role="tablist"
            >
              {(
                [
                  { value: "manual", icon: PenLine, label: "手動" },
                  { value: "recipe", icon: BookOpen, label: "レシピ" },
                  { value: "food_master", icon: Database, label: "マスタ" },
                  { value: "set_menu", icon: ListChecks, label: "セット" },
                  { value: "ocr", icon: Camera, label: "OCR" },
                ] as const
              ).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === value}
                  onClick={() => setActiveTab(value)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium transition-all",
                    activeTab === value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground/80",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="mt-3">
              {activeTab === "manual" && (
                <ManualInputForm onAdd={handleManualAdd} />
              )}
              {activeTab === "recipe" && (
                <RecipeSelector onSelect={handleRecipeAdd} />
              )}
              {activeTab === "food_master" && (
                <FoodMasterSelector onSelect={handleFoodMasterAdd} />
              )}
              {activeTab === "set_menu" && (
                <SetMenuSelector onSelect={handleSetMenuAdd} />
              )}
              {activeTab === "ocr" &&
                (ocrResult ? (
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
                ))}
            </div>

            {draftItems.length > 0 && (
              <div className="mt-3">
                <MealRegisterCard items={draftItems} onRemove={handleRemove} />
              </div>
            )}
          </div>

          {/* Sticky footer with register button */}
          {draftItems.length > 0 && (
            <div className="shrink-0 border-t bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <Button
                className="w-full"
                disabled={registerMutation.isPending}
                onClick={handleRegister}
              >
                {registerMutation.isPending
                  ? "登録中..."
                  : `${draftItems.length}件まとめて登録する`}
              </Button>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <OcrCameraOverlay
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onResult={handleOcrResult}
      />
    </>
  );
};

export { MealRegisterDrawer };
