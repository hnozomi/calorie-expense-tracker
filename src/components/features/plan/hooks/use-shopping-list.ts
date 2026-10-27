"use client";

import { use, useState } from "react";
import { buildShoppingList } from "@/components/features/plan/utils/shopping-list";
import { useWeeklyPlansContext } from "./use-weekly-plans-context";

/** The week's recipe-based plans added up into ingredients, with which ones are already bought */
export const useShoppingList = () => {
  const { plans, candidates } = useWeeklyPlansContext();
  const { recipes, hasError } = use(candidates);
  const [checkedKeys, setCheckedKeys] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const entries = buildShoppingList(plans, recipes);

  const handleToggleChecked = (entryKey: string) => {
    setCheckedKeys((previous) => {
      const next = new Set(previous);
      if (next.has(entryKey)) {
        next.delete(entryKey);
      } else {
        next.add(entryKey);
      }
      return next;
    });
  };

  return {
    entries,
    hasError,
    totalCost: entries.reduce((sum, entry) => sum + entry.estimatedCost, 0),
    checkedKeys,
    handleToggleChecked,
  };
};
