"use client";
// Client because it holds the form state and calls Server Actions from the browser

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import { totalIngredientCost } from "@/components/features/recipes/utils/recipe-cost";
import {
  deleteSetMenu,
  saveSetMenu,
} from "@/components/features/set-menus/api/actions";
import type {
  SetMenu,
  SetMenuFormValues,
  SetMenuItem,
  SetMenuItemDraft,
} from "@/components/features/set-menus/types/set-menu";
import { setMenuFormSchema } from "@/components/features/set-menus/types/set-menu";
import { calculateSetMenuTotals } from "@/components/features/set-menus/utils/set-menu-totals";
import { useUnsavedChangesGuard } from "@/hooks";
import { callAction } from "@/lib/action-result";
import { matchesSearch } from "@/utils";

const EMPTY_SET_MENU_FORM_VALUES: SetMenuFormValues = {
  name: "",
};

const toSetMenuItemDraft = (item: SetMenuItem): SetMenuItemDraft => ({
  tempId: crypto.randomUUID(),
  name: item.name,
  recipeId: item.recipeId,
  foodMasterId: item.foodMasterId,
  calories: item.calories,
  protein: item.protein,
  fat: item.fat,
  carbs: item.carbs,
  cost: item.cost,
  servingQuantity: item.servingQuantity,
});

const toSetMenuFormValues = (setMenu: SetMenu): SetMenuFormValues => ({
  name: setMenu.name,
});

type UseSetMenuFormControllerParams = {
  /** Read on the server; undefined on the new screen */
  existing: SetMenu | undefined;
  /** What can be added as items, read on the server with the screen */
  recipes: Recipe[];
  foodMasters: FoodMaster[];
};

export const useSetMenuFormController = ({
  existing,
  recipes,
  foodMasters,
}: UseSetMenuFormControllerParams) => {
  const router = useRouter();
  const isNew = existing === undefined;
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [fmSearch, setFmSearch] = useState("");
  // Initial values go in once: the screen stays mounted (hidden) after moving to another tab, and an effect
  // that reset the form would run again on return and throw away what was being edited
  const [items, setItems] = useState<SetMenuItemDraft[]>(
    () => existing?.items.map(toSetMenuItemDraft) ?? [],
  );
  const [hasItemEdits, setHasItemEdits] = useState(false);

  const form = useForm<SetMenuFormValues>({
    resolver: zodResolver(setMenuFormSchema),
    defaultValues: existing
      ? toSetMenuFormValues(existing)
      : EMPTY_SET_MENU_FORM_VALUES,
  });

  const handleAddRecipe = useCallback((recipe: Recipe) => {
    setItems((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        name: recipe.name,
        recipeId: recipe.id,
        foodMasterId: null,
        calories: recipe.calories / (recipe.servings || 1),
        protein: recipe.protein / (recipe.servings || 1),
        fat: recipe.fat / (recipe.servings || 1),
        carbs: recipe.carbs / (recipe.servings || 1),
        cost: totalIngredientCost(recipe) / (recipe.servings || 1),
        servingQuantity: 1,
      },
    ]);
    setHasItemEdits(true);
  }, []);

  const handleAddFoodMaster = useCallback((foodMaster: FoodMaster) => {
    setItems((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        name: foodMaster.name,
        recipeId: null,
        foodMasterId: foodMaster.id,
        calories: foodMaster.calories,
        protein: foodMaster.protein,
        fat: foodMaster.fat,
        carbs: foodMaster.carbs,
        cost: foodMaster.defaultPrice ?? 0,
        servingQuantity: 1,
      },
    ]);
    setHasItemEdits(true);
  }, []);

  const handleRemoveItem = useCallback((tempId: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
    setHasItemEdits(true);
  }, []);

  const handleAdjustQuantity = useCallback((tempId: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.tempId !== tempId) return item;
        return {
          ...item,
          servingQuantity: Math.max(0.5, item.servingQuantity + delta),
        };
      }),
    );
    setHasItemEdits(true);
  }, []);

  const totals = useMemo(() => calculateSetMenuTotals(items), [items]);

  // The screen stays mounted (hidden) after leaving, so discarded or saved input would still be there when
  // it is opened again; put the form back to its initial values on the way out
  const resetToInitial = () => {
    form.reset();
    setItems(existing?.items.map(toSetMenuItemDraft) ?? []);
    setHasItemEdits(false);
  };

  // The action returns a result instead of redirecting: a redirect ends the call with an exception on the
  // client, so the success toast could not be shown. The list is re-read by the action, so moving is enough
  const handleSave = form.handleSubmit((values) => {
    if (items.length === 0) {
      toast.error("アイテムを1つ以上追加してください");
      return;
    }
    startSaving(async () => {
      const result = await callAction(() =>
        saveSetMenu({ id: existing?.id, values, items }),
      );
      if (!result.ok) {
        toast.error("保存に失敗しました");
        return;
      }
      toast.success(
        isNew ? "セットメニューを登録しました" : "変更を保存しました",
      );
      if (isNew) resetToInitial();
      else {
        form.reset(values);
        setHasItemEdits(false);
      }
      router.push("/other/set-menus");
    });
  });

  const handleDelete = () => {
    if (!existing) return;
    startDeleting(async () => {
      const result = await callAction(() => deleteSetMenu({ id: existing.id }));
      if (!result.ok) {
        toast.error("削除に失敗しました");
        return;
      }
      toast.success("セットメニューを削除しました");
      router.push("/other/set-menus");
    });
  };

  const backGuard = useUnsavedChangesGuard(
    form.formState.isDirty || hasItemEdits,
    () => {
      resetToInitial();
      router.push("/other/set-menus");
    },
  );

  return {
    form,
    backGuard,
    existing,
    foodMasters: foodMasters.filter((fm) =>
      matchesSearch([fm.name, fm.brand], fmSearch),
    ),
    fmSearch,
    isDeleteConfirmOpen,
    isDeleting,
    isNew,
    isSaving,
    items,
    recipes: recipes.filter((recipe) =>
      matchesSearch([recipe.name], recipeSearch),
    ),
    recipeSearch,
    totals,
    openDeleteConfirm: () => setIsDeleteConfirmOpen(true),
    closeDeleteConfirm: () => setIsDeleteConfirmOpen(false),
    handleFmSearchChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setFmSearch(event.target.value),
    handleRecipeSearchChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setRecipeSearch(event.target.value),
    handleAddFoodMaster,
    handleAddRecipe,
    handleAdjustQuantity,
    handleDelete,
    handleRemoveItem,
    handleSave,
  };
};
