"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type {
  IngredientFormValues,
  Recipe,
  RecipeFormInput,
  RecipeFormValues,
  RecipeIngredient,
} from "../types/recipe";
import { recipeFormSchema } from "../types/recipe";
import { useDeleteRecipe } from "./use-delete-recipe";
import { useRecipeDetail } from "./use-recipe-detail";
import { useSaveRecipe } from "./use-save-recipe";

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

type UseRecipeFormControllerParams = {
  id: string;
};

export const useRecipeFormController = ({
  id,
}: UseRecipeFormControllerParams) => {
  const router = useRouter();
  const isNew = id === "new";
  const { data: existing, isLoading } = useRecipeDetail(isNew ? undefined : id);
  const saveMutation = useSaveRecipe();
  const deleteMutation = useDeleteRecipe();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [ingredients, setIngredients] = useState<EditableIngredient[]>([]);

  const form = useForm<RecipeFormInput, undefined, RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: EMPTY_RECIPE_FORM_VALUES,
  });

  useEffect(() => {
    if (!existing) {
      form.reset(EMPTY_RECIPE_FORM_VALUES);
      setIngredients([]);
      return;
    }

    form.reset(toRecipeFormValues(existing));
    setIngredients(existing.ingredients.map(toIngredientDraft));
  }, [existing, form]);

  const handleAddIngredient = useCallback(() => {
    setIngredients((prev) => [...prev, createEmptyIngredient()]);
  }, []);

  const handleRemoveIngredient = useCallback((tempId: string) => {
    setIngredients((prev) =>
      prev.filter((ingredient) => ingredient.tempId !== tempId),
    );
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

  const handleSave = form.handleSubmit(async (values) => {
    try {
      await saveMutation.mutateAsync({
        id: isNew ? undefined : id,
        values,
        ingredients: ingredients.filter((ingredient) =>
          ingredient.ingredientName.trim(),
        ),
      });
      toast.success(isNew ? "レシピを登録しました" : "変更を保存しました");
      router.push("/recipes");
    } catch {
      toast.error("保存に失敗しました");
    }
  });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("レシピを削除しました");
      router.push("/recipes");
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  return {
    form,
    existing,
    ingredients,
    isDeleteConfirmOpen,
    isLoading,
    isNew,
    totalIngredientCost,
    deleteMutation,
    saveMutation,
    setIsDeleteConfirmOpen,
    handleAddIngredient,
    handleDelete,
    handleIngredientChange,
    handleRemoveIngredient,
    handleSave,
  };
};
