"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MealItemDraft } from "../types/meal";

type MealRegisterCardProps = {
  items: MealItemDraft[];
  onRemove: (tempId: string) => void;
};

/** Display draft items accumulated before batch registration */
const MealRegisterCard = ({ items, onRemove }: MealRegisterCardProps) => {
  if (items.length === 0) return null;

  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
  const totalCost = items.reduce((sum, item) => sum + (item.cost ?? 0), 0);

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-sm font-medium text-muted-foreground">
        登録予定（{items.length}件）
      </p>
      {items.map((item) => (
        <div
          key={item.tempId}
          className="flex items-center justify-between gap-2 text-sm"
        >
          <span className="flex-1 truncate">{item.name}</span>
          <span className="text-muted-foreground">{item.calories}kcal</span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onRemove(item.tempId)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <div className="flex justify-between border-t pt-2 text-sm font-medium">
        <span>合計 {Math.round(totalCalories)} kcal</span>
        <span>¥{Math.round(totalCost)}</span>
      </div>
    </div>
  );
};

export { MealRegisterCard };
