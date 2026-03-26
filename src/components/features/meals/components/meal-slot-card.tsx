"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { CalendarPlus, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PfcDisplay } from "@/components/ui/pfc-display";
import { MEAL_TYPE_LABELS, type MealType } from "@/types";
import { cn, MEAL_TYPE_META } from "@/utils";
import { useTransferMealToPlan } from "../hooks/use-transfer-meal-to-plan";
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
  const transferToPlan = useTransferMealToPlan();

  const openDrawer = () => {
    setDrawerMealType(mealType);
    setIsDrawerOpen(true);
  };

  const handleTransferToPlan = async () => {
    try {
      await transferToPlan.mutateAsync({
        targetDate: selectedDate,
        mealType,
      });
      toast.success("献立に反映しました");
    } catch {
      toast.error("献立への反映に失敗しました");
    }
  };

  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
  const meta = MEAL_TYPE_META[mealType];
  const Icon = meta.icon;

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Header row */}
        <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg",
                meta.iconBg,
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", meta.accent)} />
            </div>
            <span className="text-sm font-semibold">
              {MEAL_TYPE_LABELS[mealType]}
            </span>
          </div>
          {items.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                {Math.round(totalCalories)} kcal
              </span>
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground active:bg-muted/80"
                onClick={handleTransferToPlan}
                disabled={transferToPlan.isPending}
                title="献立に反映"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Items list */}
        <div className="px-1.5 pb-1.5">
          {items.length === 0 ? (
            <button
              type="button"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/20 py-4 text-sm text-muted-foreground transition-colors active:bg-muted/60"
              onClick={openDrawer}
            >
              <Plus className="h-4 w-4" />
              登録する
            </button>
          ) : (
            <>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors active:bg-muted/70"
                  onClick={() => setEditingItem(item)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <PfcDisplay
                      protein={item.protein}
                      fat={item.fat}
                      carbs={item.carbs}
                      className="mt-0.5"
                    />
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="tabular-nums text-muted-foreground">
                      {Math.round(item.calories)} kcal
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                  </div>
                </button>
              ))}

              {/* Add button as a list row */}
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm text-muted-foreground transition-colors active:bg-muted/70"
                onClick={openDrawer}
              >
                <Plus className="h-3.5 w-3.5" />
                追加する
              </button>
            </>
          )}
        </div>
      </div>

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
