"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useFoodMasters } from "@/components/features/food-masters/hooks/use-food-masters";
import { useRecipes } from "@/components/features/recipes/hooks/use-recipes";
import { useDebounce } from "@/hooks";
import type {
  SetMenu,
  SetMenuFormValues,
  SetMenuItem,
  SetMenuItemDraft,
} from "../types/set-menu";
import { setMenuFormSchema } from "../types/set-menu";
import { useDeleteSetMenu } from "./use-delete-set-menu";
import { useSaveSetMenu } from "./use-save-set-menu";
import { useSetMenuDetail } from "./use-set-menu-detail";

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

const calculateTotals = (items: SetMenuItemDraft[]) =>
  items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories * item.servingQuantity,
      protein: acc.protein + item.protein * item.servingQuantity,
      fat: acc.fat + item.fat * item.servingQuantity,
      carbs: acc.carbs + item.carbs * item.servingQuantity,
      cost: acc.cost + item.cost * item.servingQuantity,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0, cost: 0 },
  );

export const useSetMenuFormController = (id: string) => {
  const router = useRouter();
  const isNew = id === "new";
  const { data: existing, isLoading } = useSetMenuDetail(
    isNew ? undefined : id,
  );
  const saveMutation = useSaveSetMenu();
  const deleteMutation = useDeleteSetMenu();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [fmSearch, setFmSearch] = useState("");
  const [items, setItems] = useState<SetMenuItemDraft[]>([]);
  const debouncedRecipeSearch = useDebounce(recipeSearch);
  const debouncedFmSearch = useDebounce(fmSearch);
  const { data: recipes } = useRecipes(debouncedRecipeSearch);
  const { data: foodMasters } = useFoodMasters(debouncedFmSearch);

  const form = useForm<SetMenuFormValues>({
    resolver: zodResolver(setMenuFormSchema),
    defaultValues: EMPTY_SET_MENU_FORM_VALUES,
  });

  useEffect(() => {
    if (!existing) {
      form.reset(EMPTY_SET_MENU_FORM_VALUES);
      setItems([]);
      return;
    }

    form.reset(toSetMenuFormValues(existing));
    setItems(existing.items.map(toSetMenuItemDraft));
  }, [existing, form]);

  const handleAddRecipe = useCallback(
    (recipe: NonNullable<typeof recipes>[number]) => {
      setItems((prev) => [
        ...prev,
        {
          tempId: crypto.randomUUID(),
          name: recipe.name,
          recipeId: recipe.id,
          foodMasterId: null,
          calories: recipe.calories / recipe.servings,
          protein: recipe.protein / recipe.servings,
          fat: recipe.fat / recipe.servings,
          carbs: recipe.carbs / recipe.servings,
          cost:
            recipe.ingredients.reduce(
              (sum, ingredient) =>
                sum + ingredient.unitPrice * ingredient.quantity,
              0,
            ) / recipe.servings,
          servingQuantity: 1,
        },
      ]);
    },
    [],
  );

  const handleAddFoodMaster = useCallback(
    (foodMaster: NonNullable<typeof foodMasters>[number]) => {
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
    },
    [],
  );

  const handleRemoveItem = useCallback((tempId: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
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
  }, []);

  const totals = useMemo(() => calculateTotals(items), [items]);

  const handleSave = form.handleSubmit(async (values) => {
    if (items.length === 0) {
      toast.error("アイテムを1つ以上追加してください");
      return;
    }

    try {
      await saveMutation.mutateAsync({
        id: isNew ? undefined : id,
        name: values.name,
        items,
      });
      toast.success(
        isNew ? "セットメニューを登録しました" : "変更を保存しました",
      );
      router.push("/other/set-menus");
    } catch {
      toast.error("保存に失敗しました");
    }
  });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("セットメニューを削除しました");
      router.push("/other/set-menus");
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  return {
    form,
    existing,
    foodMasters,
    fmSearch,
    isDeleteConfirmOpen,
    isLoading,
    isNew,
    items,
    recipes,
    recipeSearch,
    totals,
    deleteMutation,
    saveMutation,
    setFmSearch,
    setIsDeleteConfirmOpen,
    setRecipeSearch,
    handleAddFoodMaster,
    handleAddRecipe,
    handleAdjustQuantity,
    handleDelete,
    handleRemoveItem,
    handleSave,
  };
};
