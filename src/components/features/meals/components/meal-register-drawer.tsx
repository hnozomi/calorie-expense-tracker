"use client";

import {
  BookOpen,
  Camera,
  Database,
  ImageIcon,
  ListChecks,
  PenLine,
} from "lucide-react";
import { OcrCameraOverlay, OcrResultForm } from "@/components/features/ocr";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { MEAL_TYPE_LABELS } from "@/types";
import { cn } from "@/utils";
import { useMealRegisterDrawerController } from "../hooks/use-meal-register-drawer-controller";
import { FoodMasterSelector } from "./food-master-selector";
import { ManualInputForm } from "./manual-input-form";
import { MealRegisterCard } from "./meal-register-card";
import { RecipeSelector } from "./recipe-selector";
import { SetMenuSelector } from "./set-menu-selector";

/** Bottom drawer for adding meal items and batch registering */
const MealRegisterDrawer = () => {
  const {
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
  } = useMealRegisterDrawerController();

  return (
    <>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-base">
              {MEAL_TYPE_LABELS[mealType]}を登録
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              食事アイテムを追加してまとめて登録します
            </DrawerDescription>
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
                ) : isOcrProcessing ? (
                  <div className="py-10 text-center">
                    <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
                    <p className="text-sm text-muted-foreground">
                      OCR解析中...
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-muted-foreground/25 py-6 text-center">
                    <Camera className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="mb-3 text-sm text-muted-foreground">
                      栄養成分表示を撮影して自動入力
                    </p>
                    <div className="flex flex-col items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsOcrOpen(true)}
                      >
                        <Camera className="mr-1.5 size-4" />
                        カメラを起動
                      </Button>
                      <input
                        ref={libraryInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLibraryFile}
                      />
                      <Button
                        variant="ghost"
                        onClick={() => libraryInputRef.current?.click()}
                      >
                        <ImageIcon className="mr-1.5 size-4" />
                        ライブラリから選択
                      </Button>
                    </div>
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
