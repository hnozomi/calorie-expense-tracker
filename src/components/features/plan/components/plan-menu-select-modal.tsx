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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary">
              {MEAL_TYPE_LABELS[mealType]}
            </span>
            <span className="text-muted-foreground">{dateLabel}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            献立のメニューを選択または入力してください
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="mt-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="manual" className="text-xs">
              手動
            </TabsTrigger>
            <TabsTrigger value="recipe" className="text-xs">
              レシピ
            </TabsTrigger>
            <TabsTrigger value="food_master" className="text-xs">
              マスタ
            </TabsTrigger>
            <TabsTrigger value="set_menu" className="text-xs">
              セット
            </TabsTrigger>
          </TabsList>

          {/* Manual input */}
          <TabsContent value="manual" className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="plan-manual-name" className="text-xs font-medium">
                メニュー名
              </Label>
              <Input
                id="plan-manual-name"
                placeholder="例: ご飯と味噌汁"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="plan-manual-calories"
                  className="text-xs font-medium"
                >
                  カロリー (kcal)
                </Label>
                <Input
                  id="plan-manual-calories"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={manualCalories}
                  onChange={(e) => setManualCalories(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="plan-manual-cost"
                  className="text-xs font-medium"
                >
                  食費 (円)
                </Label>
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
          <TabsContent value="recipe" className="mt-4 space-y-3">
            <Input
              placeholder="レシピ名で検索..."
              value={recipeSearch}
              onChange={(e) => setRecipeSearch(e.target.value)}
              className="h-9"
            />
            <div className="max-h-52 divide-y divide-border/40 overflow-y-auto rounded-lg border border-border/60">
              {recipes && recipes.length > 0 ? (
                recipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
                    onClick={() => handleSelectRecipe(recipe)}
                  >
                    <span className="truncate font-medium">{recipe.name}</span>
                    <span className="ml-2 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {Math.round(recipe.calories / recipe.servings)} kcal
                    </span>
                  </button>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {recipeSearch
                    ? "該当するレシピがありません"
                    : "レシピが未登録です"}
                </p>
              )}
            </div>
          </TabsContent>

          {/* Food master selection */}
          <TabsContent value="food_master" className="mt-4 space-y-3">
            <Input
              placeholder="食品名で検索..."
              value={fmSearch}
              onChange={(e) => setFmSearch(e.target.value)}
              className="h-9"
            />
            <div className="max-h-52 divide-y divide-border/40 overflow-y-auto rounded-lg border border-border/60">
              {foodMasters && foodMasters.length > 0 ? (
                foodMasters.map((fm) => (
                  <button
                    key={fm.id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
                    onClick={() => handleSelectFoodMaster(fm)}
                  >
                    <span className="truncate font-medium">{fm.name}</span>
                    <span className="ml-2 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {Math.round(fm.calories)} kcal
                    </span>
                  </button>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {fmSearch
                    ? "該当する食品がありません"
                    : "食品マスタが未登録です"}
                </p>
              )}
            </div>
          </TabsContent>

          {/* Set menu selection */}
          <TabsContent value="set_menu" className="mt-4">
            <div className="max-h-52 divide-y divide-border/40 overflow-y-auto rounded-lg border border-border/60">
              {setMenus && setMenus.length > 0 ? (
                setMenus.map((sm) => (
                  <button
                    key={sm.id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
                    onClick={() => handleSelectSetMenu(sm)}
                  >
                    <span className="truncate font-medium">{sm.name}</span>
                    <span className="ml-2 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {Math.round(sm.totalCalories)} kcal
                    </span>
                  </button>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  セットメニューが未登録です
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Delete button for existing plans */}
        {existingPlan && (
          <div className="mt-3 border-t border-border/40 pt-3">
            <button
              type="button"
              className="w-full rounded-md py-2 text-center text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "削除中..." : "この献立を削除する"}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export { PlanMenuSelectModal };
