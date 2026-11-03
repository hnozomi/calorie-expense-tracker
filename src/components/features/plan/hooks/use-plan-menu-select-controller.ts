"use client";

import { startTransition, use, useRef, useState } from "react";
import { toast } from "sonner";
import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import {
  deleteMealPlan,
  saveMealPlan,
} from "@/components/features/plan/api/actions";
import type {
  MealPlan,
  MealPlanFormValues,
} from "@/components/features/plan/types/meal-plan";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import { totalIngredientCost } from "@/components/features/recipes/utils/recipe-cost";
import type { SetMenu } from "@/components/features/set-menus/types/set-menu";
import { callAction } from "@/lib/action-result";
import type { MealType } from "@/types";
import { matchesSearch } from "@/utils/matches-search";
import { useWeeklyPlansContext } from "./use-weekly-plans-context";

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
  /** Opens the dialog again after a failed save or delete; it stays mounted, so the typed values are still there */
  onReopen: () => void;
};

/** The manual form's text values for a plan (empty for a new one) */
const manualValuesOf = (plan?: MealPlan) => ({
  name: plan?.plannedName ?? "",
  calories: plan ? String(plan.calories) : "",
  protein: plan ? String(plan.protein) : "",
  fat: plan ? String(plan.fat) : "",
  carbs: plan ? String(plan.carbs) : "",
  cost: plan ? String(plan.estimatedCost) : "",
});

export const usePlanMenuSelectController = ({
  date,
  mealType,
  existingPlan,
  onClose,
  onReopen,
}: UsePlanMenuSelectControllerParams) => {
  const { showPlanChange, candidates } = useWeeklyPlansContext();
  const { recipes, foodMasters, setMenus, hasError } = use(candidates);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [fmSearch, setFmSearch] = useState("");
  const [manualName, setManualName] = useState(
    () => manualValuesOf(existingPlan).name,
  );
  const [manualCalories, setManualCalories] = useState(
    () => manualValuesOf(existingPlan).calories,
  );
  const [manualProtein, setManualProtein] = useState(
    () => manualValuesOf(existingPlan).protein,
  );
  const [manualFat, setManualFat] = useState(
    () => manualValuesOf(existingPlan).fat,
  );
  const [manualCarbs, setManualCarbs] = useState(
    () => manualValuesOf(existingPlan).carbs,
  );
  const [manualCost, setManualCost] = useState(
    () => manualValuesOf(existingPlan).cost,
  );
  // The dialog closes on the first tap, but a fast double tap reaches the handler twice before it re-renders
  const isSubmittingRef = useRef(false);

  // Opening the dialog for another plan refills the manual form. Set while rendering, not in an Effect,
  // so the form never shows the previous plan for one render
  const [filledPlan, setFilledPlan] = useState(existingPlan);
  if (existingPlan !== filledPlan) {
    setFilledPlan(existingPlan);
    const values = manualValuesOf(existingPlan);
    setManualName(values.name);
    setManualCalories(values.calories);
    setManualProtein(values.protein);
    setManualFat(values.fat);
    setManualCarbs(values.carbs);
    setManualCost(values.cost);
  }

  /** Close at once and show the plan in the cell while it is saved */
  const handleSave = (values: MealPlanFormValues, refs?: SaveRefs) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    const recipeId = refs?.recipeId ?? null;
    const foodMasterId = refs?.foodMasterId ?? null;
    const setMenuId = refs?.setMenuId ?? null;
    onClose();
    // The dialog only closes (it stays mounted), but the save must outlive the press, so it runs in a standalone transition
    startTransition(async () => {
      showPlanChange({
        type: "save",
        plan: {
          id: existingPlan?.id ?? `optimistic-${crypto.randomUUID()}`,
          userId: existingPlan?.userId ?? "",
          date,
          mealType,
          plannedName: values.plannedName,
          calories: values.calories,
          protein: values.protein,
          fat: values.fat,
          carbs: values.carbs,
          estimatedCost: values.estimatedCost,
          recipeId,
          foodMasterId,
          setMenuId,
          isTransferred: existingPlan?.isTransferred ?? false,
          createdAt: existingPlan?.createdAt ?? "",
          isOptimistic: true,
        },
      });
      const result = await callAction(() =>
        saveMealPlan({
          id: existingPlan?.id,
          date,
          mealType,
          values,
          recipeId,
          foodMasterId,
          setMenuId,
        }),
      );
      isSubmittingRef.current = false;
      if (!result.ok) {
        toast.error(`「${values.plannedName}」の保存に失敗しました`);
        onReopen();
        return;
      }
      toast.success("献立を保存しました");
    });
  };

  const handleSaveManual = () => {
    if (!manualName.trim()) {
      toast.error("メニュー名を入力してください");
      return;
    }
    // Keep the original source links when editing an existing plan via the manual tab
    const existingRefs = existingPlan
      ? {
          recipeId: existingPlan.recipeId ?? undefined,
          foodMasterId: existingPlan.foodMasterId ?? undefined,
          setMenuId: existingPlan.setMenuId ?? undefined,
        }
      : undefined;
    handleSave(
      {
        plannedName: manualName.trim(),
        calories: Number(manualCalories) || 0,
        protein: Number(manualProtein) || 0,
        fat: Number(manualFat) || 0,
        carbs: Number(manualCarbs) || 0,
        estimatedCost: Number(manualCost) || 0,
      },
      existingRefs,
    );
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    const perPerson = recipe.servings || 1;
    const cost = totalIngredientCost(recipe) / perPerson;
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
  };

  const handleSelectFoodMaster = (foodMaster: FoodMaster) => {
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
  };

  const handleSelectSetMenu = (setMenu: SetMenu) => {
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
  };

  const handleDelete = () => {
    if (!existingPlan || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    onClose();
    startTransition(async () => {
      showPlanChange({ type: "remove", planId: existingPlan.id });
      const result = await callAction(() =>
        deleteMealPlan({ id: existingPlan.id }),
      );
      isSubmittingRef.current = false;
      if (!result.ok) {
        toast.error(`「${existingPlan.plannedName}」の削除に失敗しました`);
        onReopen();
        return;
      }
      toast.success("献立を削除しました");
    });
  };

  return {
    hasCandidateError: hasError,
    foodMasters: foodMasters.filter((fm) =>
      matchesSearch([fm.name, fm.brand], fmSearch),
    ),
    fmSearch,
    manualCalories,
    manualCarbs,
    manualCost,
    manualFat,
    manualName,
    manualProtein,
    recipes: recipes.filter((recipe) =>
      matchesSearch([recipe.name], recipeSearch),
    ),
    recipeSearch,
    setFmSearch,
    setManualCalories,
    setManualCarbs,
    setManualCost,
    setManualFat,
    setManualName,
    setManualProtein,
    setRecipeSearch,
    setMenus,
    handleDelete,
    handleOpenChange: (open: boolean) => {
      if (!open) onClose();
    },
    handleSaveManual,
    handleSelectFoodMaster,
    handleSelectRecipe,
    handleSelectSetMenu,
  };
};
