"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useFoodMasters } from "@/components/features/food-masters/hooks/use-food-masters";
import { useRecipes } from "@/components/features/recipes/hooks/use-recipes";
import { useSetMenus } from "@/components/features/set-menus/hooks/use-set-menus";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks";
import type { MealType } from "@/types";
import { MEAL_TYPE_LABELS } from "@/types";
import { useDeleteMealPlan } from "../hooks/use-delete-meal-plan";
import { useSaveMealPlan } from "../hooks/use-save-meal-plan";
import type { MealPlan, MealPlanFormValues } from "../types/meal-plan";

type PlanMenuSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  mealType: MealType;
  existingPlan?: MealPlan;
};

/** Modal for selecting or editing a meal plan entry */
const PlanMenuSelectModal = ({
  isOpen,
  onClose,
  date,
  mealType,
  existingPlan,
}: PlanMenuSelectModalProps) => {
  const saveMutation = useSaveMealPlan();
  const deleteMutation = useDeleteMealPlan();
  const [recipeSearch, setRecipeSearch] = useState("");
  const [fmSearch, setFmSearch] = useState("");
  const debouncedRecipeSearch = useDebounce(recipeSearch);
  const debouncedFmSearch = useDebounce(fmSearch);
  const { data: recipes } = useRecipes(debouncedRecipeSearch);
  const { data: foodMasters } = useFoodMasters(debouncedFmSearch);
  const { data: setMenus } = useSetMenus();

  /** Manual input state */
  const [manualName, setManualName] = useState(existingPlan?.plannedName ?? "");
  const [manualCalories, setManualCalories] = useState(
    existingPlan ? String(existingPlan.calories) : "0",
  );
  const [manualCost, setManualCost] = useState(
    existingPlan ? String(existingPlan.estimatedCost) : "0",
  );

  /** Save a plan entry from the given values */
  const handleSave = useCallback(
    async (
      values: MealPlanFormValues,
      refs?: {
        recipeId?: string;
        foodMasterId?: string;
        setMenuId?: string;
      },
    ) => {
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
    [saveMutation, existingPlan, date, mealType, onClose],
  );

  /** Save manual entry */
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
  }, [manualName, manualCalories, manualCost, handleSave]);

  /** Add from recipe */
  const handleSelectRecipe = useCallback(
    (recipe: NonNullable<typeof recipes>[number]) => {
      const perPerson = recipe.servings || 1;
      const cost =
        recipe.ingredients.reduce(
          (sum, ing) => sum + ing.unitPrice * ing.quantity,
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

  /** Add from food master */
  const handleSelectFoodMaster = useCallback(
    (fm: NonNullable<typeof foodMasters>[number]) => {
      handleSave(
        {
          plannedName: fm.name,
          calories: fm.calories,
          protein: fm.protein,
          fat: fm.fat,
          carbs: fm.carbs,
          estimatedCost: fm.defaultPrice ?? 0,
        },
        { foodMasterId: fm.id },
      );
    },
    [handleSave],
  );

  /** Add from set menu */
  const handleSelectSetMenu = useCallback(
    (sm: NonNullable<typeof setMenus>[number]) => {
      handleSave(
        {
          plannedName: sm.name,
          calories: sm.totalCalories,
          protein: sm.totalProtein,
          fat: sm.totalFat,
          carbs: sm.totalCarbs,
          estimatedCost: sm.totalCost,
        },
        { setMenuId: sm.id },
      );
    },
    [handleSave],
  );

  /** Delete existing plan */
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
  }, [existingPlan, deleteMutation, onClose]);

  const dateObj = new Date(`${date}T00:00:00`);
  const dateLabel = `${dateObj.getMonth() + 1}/${dateObj.getDate()}（${"日月火水木金土"[dateObj.getDay()]}）`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {dateLabel} {MEAL_TYPE_LABELS[mealType]}
          </DialogTitle>
          <DialogDescription>
            献立のメニューを選択または入力してください
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual">
          <TabsList className="w-full">
            <TabsTrigger value="manual" className="flex-1">
              手動
            </TabsTrigger>
            <TabsTrigger value="recipe" className="flex-1">
              レシピ
            </TabsTrigger>
            <TabsTrigger value="food_master" className="flex-1">
              マスタ
            </TabsTrigger>
            <TabsTrigger value="set_menu" className="flex-1">
              セット
            </TabsTrigger>
          </TabsList>

          {/* Manual input */}
          <TabsContent value="manual" className="mt-3 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="plan-manual-name">メニュー名</Label>
              <Input
                id="plan-manual-name"
                placeholder="例: ご飯と味噌汁"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="plan-manual-calories">カロリー (kcal)</Label>
                <Input
                  id="plan-manual-calories"
                  type="number"
                  inputMode="decimal"
                  value={manualCalories}
                  onChange={(e) => setManualCalories(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="plan-manual-cost">食費 (円)</Label>
                <Input
                  id="plan-manual-cost"
                  type="number"
                  inputMode="decimal"
                  value={manualCost}
                  onChange={(e) => setManualCost(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleSaveManual}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </TabsContent>

          {/* Recipe selection */}
          <TabsContent value="recipe" className="mt-3 space-y-2">
            <Input
              placeholder="レシピ名で検索..."
              value={recipeSearch}
              onChange={(e) => setRecipeSearch(e.target.value)}
            />
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {recipes && recipes.length > 0 ? (
                recipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => handleSelectRecipe(recipe)}
                  >
                    <span className="truncate">{recipe.name}</span>
                    <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">
                      {Math.round(recipe.calories / recipe.servings)} kcal
                    </span>
                  </button>
                ))
              ) : (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  {recipeSearch
                    ? "該当するレシピがありません"
                    : "レシピが未登録です"}
                </p>
              )}
            </div>
          </TabsContent>

          {/* Food master selection */}
          <TabsContent value="food_master" className="mt-3 space-y-2">
            <Input
              placeholder="食品名で検索..."
              value={fmSearch}
              onChange={(e) => setFmSearch(e.target.value)}
            />
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {foodMasters && foodMasters.length > 0 ? (
                foodMasters.map((fm) => (
                  <button
                    key={fm.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => handleSelectFoodMaster(fm)}
                  >
                    <span className="truncate">{fm.name}</span>
                    <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">
                      {Math.round(fm.calories)} kcal
                    </span>
                  </button>
                ))
              ) : (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  {fmSearch
                    ? "該当する食品がありません"
                    : "食品マスタが未登録です"}
                </p>
              )}
            </div>
          </TabsContent>

          {/* Set menu selection */}
          <TabsContent value="set_menu" className="mt-3">
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {setMenus && setMenus.length > 0 ? (
                setMenus.map((sm) => (
                  <button
                    key={sm.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => handleSelectSetMenu(sm)}
                  >
                    <span className="truncate">{sm.name}</span>
                    <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">
                      {Math.round(sm.totalCalories)} kcal
                    </span>
                  </button>
                ))
              ) : (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  セットメニューが未登録です
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Delete button for existing plans */}
        {existingPlan && (
          <button
            type="button"
            className="mt-2 w-full text-center text-sm text-destructive hover:underline"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "削除中..." : "この献立を削除する"}
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export { PlanMenuSelectModal };
