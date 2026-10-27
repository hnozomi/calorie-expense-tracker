"use client";
// Client because the dialog, its tabs and the manual form are interactive

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MEAL_TYPE_LABELS, type MealType } from "@/types";
import { formatDisplayDate } from "@/utils";
import { usePlanMenuSelectController } from "../hooks/use-plan-menu-select-controller";
import type { MealPlan } from "../types/meal-plan";
import { DeletePlanButton } from "./delete-plan-button";
import { PlanCandidateTabs } from "./plan-candidate-tabs";
import { PlanManualForm } from "./plan-manual-form";
import { PlanMenuTabsList } from "./plan-menu-tabs-list";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onReopen: () => void;
  date: string;
  mealType: MealType;
  existingPlan?: MealPlan;
};

export const PlanMenuSelectModal = ({
  isOpen,
  onClose,
  onReopen,
  date,
  mealType,
  existingPlan,
}: Props) => {
  const menu = usePlanMenuSelectController({
    date,
    mealType,
    existingPlan,
    onClose,
    onReopen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={menu.handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary">
              {MEAL_TYPE_LABELS[mealType]}
            </span>
            <span className="text-muted-foreground">
              {formatDisplayDate(date)}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            献立のメニューを選択または入力してください
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="mt-1">
          <PlanMenuTabsList />

          <TabsContent value="manual" className="mt-4">
            <PlanManualForm
              name={{ value: menu.manualName, onChange: menu.setManualName }}
              calories={{
                value: menu.manualCalories,
                onChange: menu.setManualCalories,
              }}
              cost={{ value: menu.manualCost, onChange: menu.setManualCost }}
              protein={{
                value: menu.manualProtein,
                onChange: menu.setManualProtein,
              }}
              fat={{ value: menu.manualFat, onChange: menu.setManualFat }}
              carbs={{ value: menu.manualCarbs, onChange: menu.setManualCarbs }}
              onSave={menu.handleSaveManual}
            />
          </TabsContent>

          <PlanCandidateTabs
            hasError={menu.hasCandidateError}
            recipes={menu.recipes}
            recipeSearch={menu.recipeSearch}
            onRecipeSearchChange={menu.setRecipeSearch}
            foodMasters={menu.foodMasters}
            fmSearch={menu.fmSearch}
            onFmSearchChange={menu.setFmSearch}
            setMenus={menu.setMenus}
            onSelectRecipe={menu.handleSelectRecipe}
            onSelectFoodMaster={menu.handleSelectFoodMaster}
            onSelectSetMenu={menu.handleSelectSetMenu}
          />
        </Tabs>

        {existingPlan && (
          <DeletePlanButton
            plannedName={existingPlan.plannedName}
            onDelete={menu.handleDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
