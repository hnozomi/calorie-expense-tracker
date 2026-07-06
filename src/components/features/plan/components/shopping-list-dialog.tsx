"use client";

import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils";
import { useShoppingList } from "../hooks/use-shopping-list";
import { formatShoppingQuantity } from "../utils/shopping-list";

type ShoppingListDialogProps = {
  weekStart: string;
  isOpen: boolean;
  onClose: () => void;
};

/** Aggregated ingredient checklist for the displayed week's recipe plans */
const ShoppingListDialog = ({
  weekStart,
  isOpen,
  onClose,
}: ShoppingListDialogProps) => {
  const { entries, totalCost, isLoading } = useShoppingList(weekStart);
  const [checkedKeys, setCheckedKeys] = useState<ReadonlySet<string>>(
    new Set(),
  );

  /** Toggle the bought state of one ingredient line */
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            買い物リスト
          </DialogTitle>
          <DialogDescription>
            この週のレシピ由来の献立から材料を集計しています(手動入力の献立は含まれません)
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {["sl1", "sl2", "sl3"].map((key) => (
              <Skeleton key={key} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="rounded-lg border border-dashed border-muted-foreground/25 py-6 text-center text-sm text-muted-foreground">
            この週にレシピ由来の献立がありません
          </p>
        ) : (
          <>
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {entries.map((entry) => {
                const isChecked = checkedKeys.has(entry.key);
                return (
                  <li key={entry.key}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors active:bg-muted/60",
                        isChecked && "opacity-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={isChecked}
                        onChange={() => handleToggleChecked(entry.key)}
                      />
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-sm font-medium",
                          isChecked && "line-through",
                        )}
                      >
                        {entry.ingredientName}
                      </span>
                      <span className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                        {formatShoppingQuantity(entry.totalQuantity)}
                        {entry.unit}
                      </span>
                      <span className="whitespace-nowrap text-xs font-semibold tabular-nums">
                        ¥{Math.round(entry.estimatedCost).toLocaleString()}
                      </span>
                    </label>
                  </li>
                );
              })}
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export { ShoppingListDialog };
