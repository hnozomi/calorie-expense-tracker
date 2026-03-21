"use client";

import { useAtom, useAtomValue } from "jotai";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MEAL_TYPE_LABELS } from "@/types";
import { useRegisterMealItems } from "../hooks/use-register-meal-items";
import { selectedDateAtom } from "../stores/date-atom";
import {
  draftItemsAtom,
  drawerMealTypeAtom,
  isDrawerOpenAtom,
} from "../stores/meal-register-atom";
import type { MealItemFormValues } from "../types/meal";
import { ManualInputForm } from "./manual-input-form";
import { MealRegisterCard } from "./meal-register-card";

/** Bottom sheet drawer for adding meal items and batch registering */
const MealRegisterDrawer = () => {
  const [isOpen, setIsOpen] = useAtom(isDrawerOpenAtom);
  const mealType = useAtomValue(drawerMealTypeAtom);
  const [draftItems, setDraftItems] = useAtom(draftItemsAtom);
  const selectedDate = useAtomValue(selectedDateAtom);
  const registerMutation = useRegisterMealItems();

  const handleAdd = useCallback(
    (values: MealItemFormValues) => {
      setDraftItems((prev) => [
        ...prev,
        {
          ...values,
          tempId: crypto.randomUUID(),
          sourceType: "manual" as const,
        },
      ]);
    },
    [setDraftItems],
  );

  const handleRemove = useCallback(
    (tempId: string) => {
      setDraftItems((prev) => prev.filter((item) => item.tempId !== tempId));
    },
    [setDraftItems],
  );

  const handleRegister = async () => {
    if (draftItems.length === 0) return;

    try {
      await registerMutation.mutateAsync({
        date: selectedDate,
        mealType,
        items: draftItems,
      });
      toast.success(`${draftItems.length}件の食事を登録しました`);
      setDraftItems([]);
      setIsOpen(false);
    } catch {
      toast.error("登録に失敗しました");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{MEAL_TYPE_LABELS[mealType]}を登録</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <ManualInputForm onAdd={handleAdd} />

          <MealRegisterCard items={draftItems} onRemove={handleRemove} />

          <Button
            className="w-full"
            disabled={draftItems.length === 0 || registerMutation.isPending}
            onClick={handleRegister}
          >
            {registerMutation.isPending
              ? "登録中..."
              : `${draftItems.length}件まとめて登録する`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export { MealRegisterDrawer };
