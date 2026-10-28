"use client";
// Client because it is a form (react-hook-form) with an unsaved-changes guard and the OCR camera

import { ArrowLeft } from "lucide-react";
import { useFoodMasterFormController } from "@/components/features/food-masters/hooks/use-food-master-form-controller";
import type {
  FoodMaster,
  FoodMasterFormValues,
} from "@/components/features/food-masters/types/food-master";
import { Header, PageContainer } from "@/components/features/layout";
import { OcrCameraOverlay } from "@/components/features/ocr";
import { Button } from "@/components/ui/button";
import { EditFormFooter } from "@/components/ui/edit-form-footer";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { FoodMasterBasicSection } from "./food-master-basic-section";
import { FoodMasterNutritionSection } from "./food-master-nutrition-section";
import { FoodMasterOcrButton } from "./food-master-ocr-button";
import { FoodMasterOtherSection } from "./food-master-other-section";

type Props = {
  /** Read on the server; undefined on the new screen */
  existing?: FoodMaster;
  /** Values passed in the URL to the new screen, such as an OCR result */
  prefill: Partial<FoodMasterFormValues>;
};

export const FoodMasterFormView = ({ existing, prefill }: Props) => {
  const {
    form: {
      register,
      formState: { errors },
    },
    backGuard,
    categoryValue,
    handleCategoryChange,
    isDeleteConfirmOpen,
    isDeleting,
    isSaving,
    isNew,
    isOcrOpen,
    openDeleteConfirm,
    closeDeleteConfirm,
    openOcr,
    closeOcr,
    handleDelete,
    handleOcrResult,
    handleSave,
  } = useFoodMasterFormController(existing, prefill);

  return (
    <>
      <Header title={isNew ? "食品を登録" : "食品を編集"}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="食品マスタの一覧に戻る"
          onClick={backGuard.requestExit}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Header>
      <PageContainer>
        <form onSubmit={handleSave} className="space-y-5 p-4">
          <FoodMasterBasicSection
            register={register}
            errors={errors}
            categoryValue={categoryValue}
            onCategoryChange={handleCategoryChange}
          />

          <FoodMasterOcrButton onOpenOcr={openOcr} />

          <FoodMasterNutritionSection register={register} errors={errors} />

          <FoodMasterOtherSection register={register} errors={errors} />

          <EditFormFooter
            deleteDescription="過去の食事記録は影響を受けません。セットメニューに含まれている場合、既存の内容は保持されますが、新たに追加できなくなります。"
            deleteLabel="この食品を削除する"
            isNew={isNew}
            isSaving={isSaving}
            isDeleting={isDeleting}
            itemName={existing?.name ?? ""}
            isDeleteConfirmOpen={isDeleteConfirmOpen}
            onDeleteAsk={openDeleteConfirm}
            onDeleteCancel={closeDeleteConfirm}
            onDelete={handleDelete}
          />
        </form>
      </PageContainer>

      <OcrCameraOverlay
        isOpen={isOcrOpen}
        onClose={closeOcr}
        onResult={handleOcrResult}
      />

      <UnsavedChangesDialog
        isOpen={backGuard.isConfirmOpen}
        onOpenChange={backGuard.setIsConfirmOpen}
        onDiscard={backGuard.confirmExit}
      />
    </>
  );
};
