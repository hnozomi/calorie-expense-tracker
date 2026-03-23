"use client";

import { ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PfcDisplay } from "@/components/ui/pfc-display";
import type { MealItemDraft } from "../types/meal";

type MealRegisterCardProps = {
  items: MealItemDraft[];
  onRemove: (tempId: string) => void;
};

/** Display draft items accumulated before batch registration */
const MealRegisterCard = ({ items, onRemove }: MealRegisterCardProps) => {
  if (items.length === 0) return null;

  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      fat: acc.fat + item.fat,
      carbs: acc.carbs + item.carbs,
      cost: acc.cost + (item.cost ?? 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0, cost: 0 },
  );

  return (
    <div className="space-y-1.5 rounded-xl border bg-muted/30 p-2.5">
      <div className="flex items-center gap-1.5 px-0.5">
        <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold">登録予定（{items.length}件）</p>
      </div>
      {items.map((item) => (
        <div
          key={item.tempId}
          className="flex items-center justify-between gap-2 rounded-lg bg-background px-2.5 py-1.5 text-sm shadow-sm"
        >
          <span className="flex-1 truncate font-medium">{item.name}</span>
          <span className="tabular-nums text-muted-foreground">
            {item.calories}kcal
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(item.tempId)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <div className="flex items-center justify-between border-t px-0.5 pt-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold tabular-nums">
            合計 {Math.round(totals.calories)} kcal
          </span>
          <span className="text-[11px] text-muted-foreground">
            ¥{Math.round(totals.cost).toLocaleString()}
          </span>
        </div>
        <PfcDisplay
          protein={totals.protein}
          fat={totals.fat}
          carbs={totals.carbs}
        />
      </div>
    </div>
  );
};

export { MealRegisterCard };
