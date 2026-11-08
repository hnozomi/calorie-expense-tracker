"use client";

import { useSetAtom, useStore } from "jotai";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { registerMealItems } from "@/components/features/meals/api/actions";
import { useDailyMealsContext } from "@/components/features/meals/hooks/use-daily-meals-context";
import {
  draftItemsAtom,
  drawerMealTypeAtom,
  isDrawerOpenAtom,
} from "@/components/features/meals/stores/meal-register-atom";
import type {
  MealItemDraft,
  PendingFormItem,
} from "@/components/features/meals/types/meal";
import { callAction } from "@/lib/action-result";
import type { MealType } from "@/types";

type Params = {
  draftItems: MealItemDraft[];
  mealType: MealType;
  collectPendingFormItems: () => PendingFormItem[];
  closeDrawer: () => void;
  isShown: () => boolean;
};

/** Saves the drafts, asking first when typed-but-unadded input would be left behind */
export const useMealRegisterSave = ({
  draftItems,
  mealType,
  collectPendingFormItems,
  closeDrawer,
  isShown,
}: Params) => {
  const store = useStore();
  const setDraftItems = useSetAtom(draftItemsAtom);
  const setDrawerMealType = useSetAtom(drawerMealTypeAtom);
  const setIsOpen = useSetAtom(isDrawerOpenAtom);
  const { date, showMealChange } = useDailyMealsContext();
  const [isRegistering, startRegistering] = useTransition();
  const [pendingRegisterItems, setPendingRegisterItems] = useState<
    PendingFormItem[] | null
  >(null);

  /** Close the drawer and show the items in the slot at once. On failure the drawer opens again with the drafts kept */
  const registerItems = useCallback(
    (items: MealItemDraft[]) => {
      // Clear the drawer now, not after the save: it may be reopened for another slot while this one is saving
      closeDrawer();
      startRegistering(async () => {
        showMealChange({ type: "add", mealType, items });
        const result = await callAction(() =>
          registerMealItems({ date, mealType, items }),
        );
        if (!result.ok) {
          toast.error("登録に失敗しました。もう一度お試しください");
          // Give the drafts back to their own slot, unless the drawer already holds new ones by now
          // (read from the store: the drafts in this closure are from before the save)
          if (store.get(draftItemsAtom).length > 0) return;
          setDrawerMealType(mealType);
          setDraftItems(items);
          // After a move to another tab the drafts wait in the drawer instead of popping up on return
          if (isShown()) setIsOpen(true);
          return;
        }
        toast.success(`${items.length}件の食事を登録しました`);
      });
    },
    [
      closeDrawer,
      date,
      mealType,
      setDraftItems,
      setDrawerMealType,
      setIsOpen,
      showMealChange,
      store,
      isShown,
    ],
  );

  const handleRegister = () => {
    if (draftItems.length === 0) return;

    const pendingItems = collectPendingFormItems();
    if (pendingItems.length > 0) {
      setPendingRegisterItems(pendingItems);
      return;
    }
    registerItems(draftItems);
  };

  /** Include the typed-but-unadded entries and register everything */
  const handleRegisterWithPending = useCallback(() => {
    if (!pendingRegisterItems) return;
    const pendingDrafts = pendingRegisterItems.map((pending) => ({
      ...pending.values,
      tempId: crypto.randomUUID(),
      sourceType: pending.sourceType,
    }));
    setPendingRegisterItems(null);
    registerItems([...draftItems, ...pendingDrafts]);
  }, [draftItems, pendingRegisterItems, registerItems]);

  /** Register only the carded drafts, discarding typed-but-unadded input */
  const handleRegisterWithoutPending = useCallback(() => {
    setPendingRegisterItems(null);
    registerItems(draftItems);
  }, [draftItems, registerItems]);

  return {
    isRegistering,
    pendingRegisterItems,
    pendingNames:
      pendingRegisterItems?.map((pending) => pending.values.name) ?? null,
    setPendingRegisterItems,
    handlePendingDialogOpenChange: (open: boolean) => {
      if (!open) setPendingRegisterItems(null);
    },
    handleRegister,
    handleRegisterWithPending,
    handleRegisterWithoutPending,
  };
};
