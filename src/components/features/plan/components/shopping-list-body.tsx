"use client";
// Client because ticking an ingredient is local state, and the recipes are unwrapped with use()

import { useShoppingList } from "@/components/features/plan/hooks/use-shopping-list";
import { ShoppingListRow } from "./shopping-list-row";

export const ShoppingListBody = () => {
  const { entries, hasError, totalCost, checkedKeys, handleToggleChecked } =
    useShoppingList();

  if (hasError) {
    return (
      <p className="rounded-lg border border-dashed border-destructive/40 py-6 text-center text-sm text-destructive">
        レシピを読み込めませんでした。画面を開き直してください
      </p>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-muted-foreground/25 py-6 text-center text-sm text-muted-foreground">
        この週にレシピ由来の献立がありません
      </p>
    );
  }

  return (
    <>
      <ul className="max-h-72 space-y-1 overflow-y-auto">
        {entries.map((entry) => (
          <ShoppingListRow
            key={entry.key}
            entry={entry}
            isChecked={checkedKeys.has(entry.key)}
            onToggle={handleToggleChecked}
          />
        ))}
      </ul>
      <div className="flex items-center justify-between border-t pt-3 text-sm">
        <span className="text-muted-foreground">
          概算合計({entries.length}品)
        </span>
        <span className="font-bold tabular-nums">
          ¥{Math.round(totalCost).toLocaleString()}
        </span>
      </div>
    </>
  );
};
