"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PfcDisplay } from "@/components/ui/pfc-display";
import { MEAL_TYPE_LABELS, type MealType } from "@/types";
import { cn, MEAL_TYPE_META } from "@/utils";
import { selectedDateAtom } from "../stores/date-atom";
import {
  drawerMealTypeAtom,
  isDrawerOpenAtom,
} from "../stores/meal-register-atom";
import type { MealItem } from "../types/meal";
import { MealItemEditModal } from "./meal-item-edit-modal";

type MealSlotCardProps = {
  mealType: MealType;
  items: MealItem[];
};

/** A single meal slot (breakfast/lunch/dinner/snack) showing its items */
const MealSlotCard = ({ mealType, items }: MealSlotCardProps) => {
  const setIsDrawerOpen = useSetAtom(isDrawerOpenAtom);
  const setDrawerMealType = useSetAtom(drawerMealTypeAtom);
  const selectedDate = useAtomValue(selectedDateAtom);
  const [editingItem, setEditingItem] = useState<MealItem | null>(null);

  const openDrawer = () => {
    setDrawerMealType(mealType);
    setIsDrawerOpen(true);
  };

  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
  const meta = MEAL_TYPE_META[mealType];
  const Icon = meta.icon;

  return (
    <>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  meta.iconBg,
                )}
              >
                <Icon className={cn("h-4 w-4", meta.accent)} />
              </div>
              <CardTitle className="text-base font-semibold">
                {MEAL_TYPE_LABELS[mealType]}
              </CardTitle>
            </div>
            {items.length > 0 && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums">
                {Math.round(totalCalories)} kcal
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/25 py-5 text-center">
              <p className="mb-2 text-sm text-muted-foreground">
                まだ登録されていません
              </p>
              <Button variant="outline" size="sm" onClick={openDrawer}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                登録する
              </Button>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full flex-col rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted active:bg-muted/80"
                  onClick={() => setEditingItem(item)}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="flex-1 truncate font-medium">
                      {item.name}
                    </span>
                    <span className="ml-2 tabular-nums text-muted-foreground">
                      {Math.round(item.calories)} kcal
                    </span>
                  </div>
                  <PfcDisplay
                    protein={item.protein}
                    fat={item.fat}
                    carbs={item.carbs}
                    className="mt-0.5 self-end"
                  />
                </button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={openDrawer}
              >
                <Plus className="mr-1 h-4 w-4" />
                追加する
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <MealItemEditModal
        key={editingItem?.id}
        item={editingItem}
        date={selectedDate}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
      />
    </>
  );
};

export { MealSlotCard };
