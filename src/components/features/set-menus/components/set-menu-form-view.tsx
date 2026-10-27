"use client";
// Client because it is a form (react-hook-form) with items edited in place and an unsaved-changes guard

import { ArrowLeft } from "lucide-react";
import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import { Header, PageContainer } from "@/components/features/layout";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import { useSetMenuFormController } from "@/components/features/set-menus/hooks/use-set-menu-form-controller";
import type { SetMenu } from "@/components/features/set-menus/types/set-menu";
import { Button } from "@/components/ui/button";
import { EditFormFooter } from "@/components/ui/edit-form-footer";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { SetMenuAddItemsSection } from "./set-menu-add-items-section";
import { SetMenuBasicSection } from "./set-menu-basic-section";
import { SetMenuItemsSection } from "./set-menu-items-section";

type Props = {
  /** Read on the server; undefined on the new screen */
  existing?: SetMenu;
  recipes: Recipe[];
  foodMasters: FoodMaster[];
};

export const SetMenuFormView = ({ existing, recipes, foodMasters }: Props) => {
  const menu = useSetMenuFormController({ existing, recipes, foodMasters });
  const {
    register,
    formState: { errors },
  } = menu.form;

  return (
    <>
      <Header
        title={menu.isNew ? "セットメニューを登録" : "セットメニューを編集"}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="セットメニューの一覧に戻る"
          onClick={menu.backGuard.requestExit}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Header>
      <PageContainer>
        <form onSubmit={menu.handleSave} className="space-y-5 p-4">
          <SetMenuBasicSection register={register} errors={errors} />
          <SetMenuItemsSection
            items={menu.items}
            totals={menu.totals}
            onAdjustQuantity={menu.handleAdjustQuantity}
            onRemove={menu.handleRemoveItem}
          />
          <SetMenuAddItemsSection
            recipes={menu.recipes}
            foodMasters={menu.foodMasters}
            recipeSearch={menu.recipeSearch}
            fmSearch={menu.fmSearch}
            onRecipeSearchChange={menu.handleRecipeSearchChange}
            onFmSearchChange={menu.handleFmSearchChange}
            onAddRecipe={menu.handleAddRecipe}
            onAddFoodMaster={menu.handleAddFoodMaster}
          />
          <EditFormFooter
            isNew={menu.isNew}
            deleteLabel="このセットメニューを削除する"
            deleteDescription="過去の食事記録は影響を受けません。"
            isSaving={menu.isSaving}
            isDeleting={menu.isDeleting}
            itemName={menu.existing?.name ?? ""}
            isDeleteConfirmOpen={menu.isDeleteConfirmOpen}
            onDeleteAsk={menu.openDeleteConfirm}
            onDeleteCancel={menu.closeDeleteConfirm}
            onDelete={menu.handleDelete}
          />
        </form>
      </PageContainer>

      <UnsavedChangesDialog
        isOpen={menu.backGuard.isConfirmOpen}
        onOpenChange={menu.backGuard.setIsConfirmOpen}
        onDiscard={menu.backGuard.confirmExit}
      />
    </>
  );
};
