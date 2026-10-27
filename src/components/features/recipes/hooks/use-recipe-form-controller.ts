"use client";
// Client because it holds the form state and calls Server Actions from the browser

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  deleteRecipe,
  saveRecipe,
} from "@/components/features/recipes/api/actions";
import type {
  IngredientFormValues,
  Recipe,
  RecipeFormInput,
  RecipeFormValues,
  RecipeIngredient,
} from "@/components/features/recipes/types/recipe";
import { recipeFormSchema } from "@/components/features/recipes/types/recipe";
import { useUnsavedChangesGuard } from "@/hooks";
import { callAction } from "@/lib/action-result";
import { useRefreshLegacyScreens } from "@/lib/legacy-bridge";

export type EditableIngredient = IngredientFormValues & { tempId: string };

const EMPTY_RECIPE_FORM_VALUES: RecipeFormValues = {
  name: "",
  servings: 1,
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
};

const toIngredientDraft = (
  ingredient: RecipeIngredient,
): EditableIngredient => ({
  tempId: crypto.randomUUID(),
  id: ingredient.id,
  ingredientName: ingredient.ingredientName,
  quantity: ingredient.quantity,
  unit: ingredient.unit,
  unitPrice: ingredient.unitPrice,
});

const toRecipeFormValues = (recipe: Recipe): RecipeFormValues => ({
  name: recipe.name,
  servings: recipe.servings,
  calories: recipe.calories,
  protein: recipe.protein,
  fat: recipe.fat,
  carbs: recipe.carbs,
  notes: recipe.notes ?? undefined,
});

const createEmptyIngredient = (): EditableIngredient => ({
  tempId: crypto.randomUUID(),
  ingredientName: "",
  quantity: 1,
  unit: "",
  unitPrice: 0,
});

/** existing is read on the server; undefined on the new-recipe screen */
export const useRecipeFormController = (existing: Recipe | undefined) => {
  const router = useRouter();
  const refreshLegacyScreens = useRefreshLegacyScreens();
  const isNew = existing === undefined;
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  // Initial values go in once: the screen stays mounted (hidden) after moving to another tab, and an effect
  // that reset the form would run again on return and throw away what was being typed
  const [ingredients, setIngredients] = useState<EditableIngredient[]>(
    () => existing?.ingredients.map(toIngredientDraft) ?? [],
  );
  const [hasIngredientEdits, setHasIngredientEdits] = useState(false);

  const form = useForm<RecipeFormInput, undefined, RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: existing
      ? toRecipeFormValues(existing)
      : EMPTY_RECIPE_FORM_VALUES,
  });

  const handleAddIngredient = useCallback(() => {
    setIngredients((prev) => [...prev, createEmptyIngredient()]);
    setHasIngredientEdits(true);
  }, []);

  const handleRemoveIngredient = useCallback((tempId: string) => {
    setIngredients((prev) =>
      prev.filter((ingredient) => ingredient.tempId !== tempId),
    );
    setHasIngredientEdits(true);
  }, []);

  const handleIngredientChange = useCallback(
    (tempId: string, field: keyof IngredientFormValues, value: string) => {
      setIngredients((prev) =>
        prev.map((ingredient) => {
          if (ingredient.tempId !== tempId) return ingredient;
          if (field === "ingredientName" || field === "unit") {
            return { ...ingredient, [field]: value };
          }
          return { ...ingredient, [field]: Number(value) || 0 };
        }),
      );
      setHasIngredientEdits(true);
    },
    [],
  );

  const totalIngredientCost = useMemo(
    () =>
      ingredients.reduce(
        (sum, ingredient) => sum + ingredient.unitPrice * ingredient.quantity,
        0,
      ),
    [ingredients],
  );

  // The action returns a result instead of redirecting: a redirect ends the call with an exception on the
  // client, so the success toast could not be shown. The list is re-read by the action, so moving is enough
  const handleSave = form.handleSubmit((values) => {
    startSaving(async () => {
      const result = await callAction(() =>
        saveRecipe({
          id: existing?.id,
          values,
          ingredients: ingredients.filter((ingredient) =>
            ingredient.ingredientName.trim(),
          ),
        }),
      );
      if (!result.ok) {
        toast.error("保存に失敗しました");
        return;
      }
      toast.success(isNew ? "レシピを登録しました" : "変更を保存しました");
      // A new recipe's screen starts empty again; an edited one keeps the saved values as its clean state
      if (isNew) resetToInitial();
      else {
        form.reset(values);
        setHasIngredientEdits(false);
      }
      refreshLegacyScreens();
      router.push("/recipes");
    });
  });

  const handleDelete = () => {
    if (!existing) return;
    startDeleting(async () => {
      const result = await callAction(() => deleteRecipe({ id: existing.id }));
      if (!result.ok) {
        toast.error("削除に失敗しました");
        return;
      }
      toast.success("レシピを削除しました");
      refreshLegacyScreens();
      router.push("/recipes");
    });
  };

  // Leaving with unsaved edits asks first (back button and the header's back arrow)
  // The screen stays mounted (hidden) after leaving, so discarded or saved input would still be there when
  // it is opened again; put the form back to its initial values on the way out
  const resetToInitial = () => {
    form.reset();
    setIngredients(existing?.ingredients.map(toIngredientDraft) ?? []);
    setHasIngredientEdits(false);
  };

  const backGuard = useUnsavedChangesGuard(
    form.formState.isDirty || hasIngredientEdits,
    () => {
      resetToInitial();
      router.push("/recipes");
    },
  );

  return {
    form,
    backGuard,
    existing,
    hasUnsavedChanges: form.formState.isDirty || hasIngredientEdits,
    ingredients,
    isDeleteConfirmOpen,
    isDeleting,
    isNew,
    isSaving,
    totalIngredientCost,
    setIsDeleteConfirmOpen,
    openDeleteConfirm: () => setIsDeleteConfirmOpen(true),
    closeDeleteConfirm: () => setIsDeleteConfirmOpen(false),
    handleAddIngredient,
    handleDelete,
    handleIngredientChange,
    handleRemoveIngredient,
    handleSave,
  };
};
