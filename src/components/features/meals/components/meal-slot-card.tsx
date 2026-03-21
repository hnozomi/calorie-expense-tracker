"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MEAL_TYPE_LABELS, type MealType } from "@/types";
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

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {MEAL_TYPE_LABELS[mealType]}
            </CardTitle>
            {items.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {Math.round(totalCalories)} kcal
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {items.length === 0 ? (
            <div className="py-4 text-center">
              <p className="mb-2 text-sm text-muted-foreground">
                まだ登録されていません
              </p>
              <Button variant="outline" size="sm" onClick={openDrawer}>
                登録する
              </Button>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => setEditingItem(item)}
                >
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="ml-2 text-muted-foreground">
                    {Math.round(item.calories)} kcal
                  </span>
                </button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
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
