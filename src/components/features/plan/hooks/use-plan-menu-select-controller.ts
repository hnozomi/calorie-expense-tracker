"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useFoodMasters } from "@/components/features/food-masters/hooks/use-food-masters";
import { useRecipes } from "@/components/features/recipes/hooks/use-recipes";
import { useSetMenus } from "@/components/features/set-menus/hooks/use-set-menus";
import { useDebounce } from "@/hooks";
import type { MealType } from "@/types";
import type { MealPlan, MealPlanFormValues } from "../types/meal-plan";
import { useDeleteMealPlan } from "./use-delete-meal-plan";
import { useSaveMealPlan } from "./use-save-meal-plan";

type SaveRefs = {
  recipeId?: string;
  foodMasterId?: string;
  setMenuId?: string;
};

type UsePlanMenuSelectControllerParams = {
  date: string;
  mealType: MealType;
  existingPlan?: MealPlan;
  onClose: () => void;
};

export const usePlanMenuSelectController = ({
  date,
  mealType,
  existingPlan,
  onClose,
}: UsePlanMenuSelectControllerParams) => {
  const saveMutation = useSaveMealPlan();
  const deleteMutation = useDeleteMealPlan();
  const [recipeSearch, setRecipeSearch] = useState("");
  const [fmSearch, setFmSearch] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualCalories, setManualCalories] = useState("0");
  const [manualCost, setManualCost] = useState("0");
  const debouncedRecipeSearch = useDebounce(recipeSearch);
  const debouncedFmSearch = useDebounce(fmSearch);
  const { data: recipes } = useRecipes(debouncedRecipeSearch);
  const { data: foodMasters } = useFoodMasters(debouncedFmSearch);
  const { data: setMenus } = useSetMenus();

  useEffect(() => {
    setManualName(existingPlan?.plannedName ?? "");
    setManualCalories(existingPlan ? String(existingPlan.calories) : "0");
    setManualCost(existingPlan ? String(existingPlan.estimatedCost) : "0");
  }, [existingPlan]);

  const handleSave = useCallback(
    async (values: MealPlanFormValues, refs?: SaveRefs) => {
      try {
        await saveMutation.mutateAsync({
          id: existingPlan?.id,
          date,
          mealType,
          values,
          recipeId: refs?.recipeId ?? null,
          foodMasterId: refs?.foodMasterId ?? null,
          setMenuId: refs?.setMenuId ?? null,
        });
        toast.success("献立を保存しました");
        onClose();
      } catch (error) {
        console.error("Failed to save meal plan:", error);
        toast.error("保存に失敗しました");
      }
    },
    [date, existingPlan, mealType, onClose, saveMutation],
  );

  const handleSaveManual = useCallback(() => {
    if (!manualName.trim()) {
      toast.error("メニュー名を入力してください");
      return;
    }

    handleSave({
      plannedName: manualName.trim(),
      calories: Number(manualCalories) || 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      estimatedCost: Number(manualCost) || 0,
    });
  }, [handleSave, manualCalories, manualCost, manualName]);

  const handleSelectRecipe = useCallback(
    (recipe: NonNullable<typeof recipes>[number]) => {
      const perPerson = recipe.servings || 1;
      const cost =
        recipe.ingredients.reduce(
          (sum, ingredient) => sum + ingredient.unitPrice * ingredient.quantity,
          0,
        ) / perPerson;

      handleSave(
        {
          plannedName: recipe.name,
          calories: recipe.calories / perPerson,
          protein: recipe.protein / perPerson,
          fat: recipe.fat / perPerson,
          carbs: recipe.carbs / perPerson,
          estimatedCost: cost,
        },
        { recipeId: recipe.id },
      );
    },
    [handleSave],
  );

  const handleSelectFoodMaster = useCallback(
    (foodMaster: NonNullable<typeof foodMasters>[number]) => {
      handleSave(
        {
          plannedName: foodMaster.name,
          calories: foodMaster.calories,
          protein: foodMaster.protein,
          fat: foodMaster.fat,
          carbs: foodMaster.carbs,
          estimatedCost: foodMaster.defaultPrice ?? 0,
        },
        { foodMasterId: foodMaster.id },
      );
    },
    [handleSave],
  );

  const handleSelectSetMenu = useCallback(
    (setMenu: NonNullable<typeof setMenus>[number]) => {
      handleSave(
        {
          plannedName: setMenu.name,
          calories: setMenu.totalCalories,
          protein: setMenu.totalProtein,
          fat: setMenu.totalFat,
          carbs: setMenu.totalCarbs,
          estimatedCost: setMenu.totalCost,
        },
        { setMenuId: setMenu.id },
      );
    },
    [handleSave],
  );

  const handleDelete = useCallback(async () => {
    if (!existingPlan) return;

    try {
      await deleteMutation.mutateAsync(existingPlan.id);
      toast.success("献立を削除しました");
      onClose();
    } catch (error) {
      console.error("Failed to delete meal plan:", error);
      toast.error("削除に失敗しました");
    }
  }, [deleteMutation, existingPlan, onClose]);

  return {
    deleteMutation,
    foodMasters,
    fmSearch,
    manualCalories,
    manualCost,
    manualName,
    recipes,
    recipeSearch,
    saveMutation,
    setFmSearch,
    setManualCalories,
    setManualCost,
    setManualName,
    setRecipeSearch,
    setMenus,
    handleDelete,
    handleSaveManual,
    handleSelectFoodMaster,
    handleSelectRecipe,
    handleSelectSetMenu,
  };
};
