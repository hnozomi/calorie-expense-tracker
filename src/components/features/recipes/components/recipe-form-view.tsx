"use client";
// Client because it is a form (react-hook-form) with an unsaved-changes guard

import { ArrowLeft } from "lucide-react";
import { Header, PageContainer } from "@/components/features/layout";
import { useRecipeFormController } from "@/components/features/recipes/hooks/use-recipe-form-controller";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import { Button } from "@/components/ui/button";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { RecipeBasicSection } from "./recipe-basic-section";
import { RecipeFormFooter } from "./recipe-form-footer";
import { RecipeIngredientsEditor } from "./recipe-ingredients-editor";
import { RecipeNotesSection } from "./recipe-notes-section";
import { RecipeNutritionSection } from "./recipe-nutrition-section";

type Props = {
  /** Read on the server; undefined on the new-recipe screen */
  existing?: Recipe;
};

export const RecipeFormView = ({ existing }: Props) => {
  const {
    form: {
      register,
      formState: { errors },
    },
    backGuard,
    ingredients,
    isDeleteConfirmOpen,
    isDeleting,
    isSaving,
    isNew,
    totalIngredientCost,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleAddIngredient,
    handleDelete,
    handleIngredientChange,
    handleRemoveIngredient,
    handleSave,
  } = useRecipeFormController(existing);

  return (
    <>
      <Header title={isNew ? "レシピを登録" : "レシピを編集"}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="レシピの一覧に戻る"
          onClick={backGuard.requestExit}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Header>
      <PageContainer>
        <form onSubmit={handleSave} className="space-y-5 p-4">
          <RecipeBasicSection register={register} errors={errors} />

          <RecipeNutritionSection
            register={register}
            errors={errors}
            totalIngredientCost={totalIngredientCost}
          />

          <RecipeIngredientsEditor
            ingredients={ingredients}
            onAdd={handleAddIngredient}
            onChange={handleIngredientChange}
            onRemove={handleRemoveIngredient}
          />

          <RecipeNotesSection register={register} />

          <RecipeFormFooter
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

      <UnsavedChangesDialog
        isOpen={backGuard.isConfirmOpen}
        onOpenChange={backGuard.setIsConfirmOpen}
        onDiscard={backGuard.confirmExit}
      />
    </>
  );
};
