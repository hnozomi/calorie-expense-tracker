"use client";
// Client because the drawer, its tabs and the OCR camera are interactive

import { Suspense } from "react";
import { OcrCameraOverlay } from "@/components/features/ocr";
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
import type { DrawerCandidates } from "../types/drawer-candidates";
import { CandidateListSkeleton } from "./candidate-list-skeleton";
import { CandidateSelector } from "./candidate-selector";
import { DiscardDraftsDialog } from "./discard-drafts-dialog";
import { ManualInputForm } from "./manual-input-form";
import { MealRegisterCard } from "./meal-register-card";
import { OcrPanel } from "./ocr-panel";
import { PendingInputDialog } from "./pending-input-dialog";
import { RegisterFooter } from "./register-footer";
import { RegisterTabBar } from "./register-tab-bar";

type Props = {
  /** Read on the server with the home screen; the lists are ready by the time the drawer opens */
  candidates: Promise<DrawerCandidates>;
};

export const MealRegisterDrawer = ({ candidates }: Props) => {
  const drawer = useMealRegisterDrawerController();

  return (
    <>
      {/* On iOS, repositionInputs lifted the drawer when the keyboard opened, and dragging it
          back down from the form counted as a close, so the discard dialog kept appearing */}
      <Drawer
        open={drawer.isOpen}
        onOpenChange={drawer.handleOpenChange}
        repositionInputs={false}
        handleOnly
      >
        {/* max-h override needed: the base DrawerContent caps at max-h-[80vh] */}
        <DrawerContent className="h-[85dvh] max-h-[85dvh]">
          <DrawerHeader className="shrink-0 pb-2">
            <DrawerTitle className="text-base">
              {MEAL_TYPE_LABELS[drawer.mealType]}を登録
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              食事アイテムを追加してまとめて登録します
            </DrawerDescription>
          </DrawerHeader>

          <RegisterTabBar
            activeTab={drawer.activeTab}
            onTabChange={drawer.setActiveTab}
          />

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
            <div className="mt-3">
              {/* Manual and OCR panels stay mounted (hidden) so typed input and
                  OCR corrections survive tab switches */}
              <div className={cn(drawer.activeTab !== "manual" && "hidden")}>
                <ManualInputForm
                  onAdd={drawer.handleManualAdd}
                  pendingItemRef={drawer.manualPendingRef}
                />
              </div>
              {drawer.activeTab !== "manual" && drawer.activeTab !== "ocr" && (
                <Suspense fallback={<CandidateListSkeleton />}>
                  <CandidateSelector
                    tab={drawer.activeTab}
                    candidates={candidates}
                    onRecentSelect={drawer.handleRecentAdd}
                    onRecipeSelect={drawer.handleRecipeAdd}
                    onFoodMasterSelect={drawer.handleFoodMasterAdd}
                    onSetMenuSelect={drawer.handleSetMenuAdd}
                  />
                </Suspense>
              )}
              <div className={cn(drawer.activeTab !== "ocr" && "hidden")}>
                <OcrPanel
                  ocrResult={drawer.ocrResult}
                  isProcessing={drawer.isOcrProcessing}
                  error={drawer.ocrError}
                  libraryInputRef={drawer.libraryInputRef}
                  pendingItemRef={drawer.ocrPendingRef}
                  onOpenCamera={drawer.openOcrCamera}
                  onOpenLibrary={drawer.openLibraryPicker}
                  onLibraryFile={drawer.handleLibraryFile}
                  onAdd={drawer.handleOcrAdd}
                  onSaveToMaster={drawer.handleSaveToMaster}
                />
              </div>
            </div>

            {drawer.draftItems.length > 0 && (
              <div className="mt-3">
                <MealRegisterCard
                  items={drawer.draftItems}
                  onRemove={drawer.handleRemove}
                />
              </div>
            )}
          </div>

          {drawer.draftItems.length > 0 && (
            <RegisterFooter
              draftCount={drawer.draftItems.length}
              lastDraftName={drawer.lastDraftName}
              totalCalories={drawer.totalDraftCalories}
              isRegistering={drawer.isRegistering}
              onRegister={drawer.handleRegister}
            />
          )}
        </DrawerContent>
      </Drawer>

      <OcrCameraOverlay
        isOpen={drawer.isOcrOpen}
        onClose={drawer.closeOcrCamera}
        onResult={drawer.handleOcrResult}
      />

      <DiscardDraftsDialog
        isOpen={drawer.isDiscardConfirmOpen}
        draftCount={drawer.draftItems.length}
        onOpenChange={drawer.setIsDiscardConfirmOpen}
        onDiscard={drawer.handleDiscardDrafts}
      />

      <PendingInputDialog
        pendingNames={drawer.pendingNames}
        onOpenChange={drawer.handlePendingDialogOpenChange}
        onRegisterWithoutPending={drawer.handleRegisterWithoutPending}
        onRegisterWithPending={drawer.handleRegisterWithPending}
      />
    </>
  );
};
