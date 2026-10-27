"use client";
// Client because it opens the register and edit drawers and runs the slot actions

import { Plus } from "lucide-react";
import { MEAL_TYPE_LABELS, type MealType } from "@/types";
import { useMealSlot } from "../hooks/use-meal-slot";
import type { DisplayedMealItem } from "../types/meal";
import { EmptySlotActions } from "./empty-slot-actions";
import { MealItemEditModal } from "./meal-item-edit-modal";
import { MealItemRow } from "./meal-item-row";
import { MealSlotHeader } from "./meal-slot-header";

type Props = {
  mealType: MealType;
  items: DisplayedMealItem[];
};

export const MealSlotCard = ({ mealType, items }: Props) => {
  const {
    editingItem,
    isCopying,
    isTransferring,
    totalCalories,
    openDrawer,
    handleCopyPreviousDay,
    handleTransferToPlan,
    startEditing,
    stopEditing,
    reopenEditing,
  } = useMealSlot(mealType, items);

  return (
    <>
      <section
        aria-label={`${MEAL_TYPE_LABELS[mealType]}の記録`}
        className="overflow-hidden rounded-xl border bg-card shadow-sm"
      >
        <MealSlotHeader
          mealType={mealType}
          hasItems={items.length > 0}
          totalCalories={totalCalories}
          isTransferring={isTransferring}
          onTransfer={handleTransferToPlan}
        />

        {/* Items list */}
        <div className="px-1.5 pb-1.5">
          {items.length === 0 ? (
            <EmptySlotActions
              isCopying={isCopying}
              onRegister={openDrawer}
              onCopyPreviousDay={handleCopyPreviousDay}
            />
          ) : (
            <>
              {items.map((item) => (
                <MealItemRow key={item.id} item={item} onEdit={startEditing} />
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
      </section>

      <MealItemEditModal
        key={editingItem?.id}
        item={editingItem}
        isOpen={!!editingItem}
        onClose={stopEditing}
        onSaveFailed={reopenEditing}
      />
    </>
  );
};
