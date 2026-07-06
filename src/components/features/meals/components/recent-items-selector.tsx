"use client";

import { History } from "lucide-react";
import { PfcDisplay } from "@/components/ui/pfc-display";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentMealItems } from "../hooks/use-recent-meal-items";
import type { RecentMealItem } from "../utils/recent-meal-items";

type RecentItemsSelectorProps = {
  onSelect: (item: RecentMealItem) => void;
};

/** List of recently registered items for one-tap re-adding */
const RecentItemsSelector = ({ onSelect }: RecentItemsSelectorProps) => {
  const { data: recentItems, isLoading } = useRecentMealItems();

  if (isLoading) {
    return (
      <div className="space-y-1">
        {["ri1", "ri2", "ri3", "ri4"].map((key) => (
          <Skeleton key={key} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!recentItems || recentItems.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/25 py-6 text-center">
        <History className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          まだ記録がありません。登録したアイテムがここに表示され、次回からワンタップで再登録できます。
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-64 space-y-1 overflow-y-auto">
      {recentItems.map((item) => (
        <button
          key={item.name}
          type="button"
          className="flex w-full flex-col gap-1 rounded-lg border border-transparent px-3 py-2.5 text-left text-sm transition-colors hover:border-border hover:bg-muted active:bg-muted/80"
          onClick={() => onSelect(item)}
        >
          <div className="flex w-full items-center justify-between">
            <span className="min-w-0 truncate font-medium">{item.name}</span>
            <span className="ml-2 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
              {Math.round(item.calories)} kcal
            </span>
          </div>
          <PfcDisplay
            protein={item.protein}
            fat={item.fat}
            carbs={item.carbs}
          />
        </button>
      ))}
    </div>
  );
};

export { RecentItemsSelector };
