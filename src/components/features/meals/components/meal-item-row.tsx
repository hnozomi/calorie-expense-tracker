import { ChevronRight } from "lucide-react";
import { PfcDisplay } from "@/components/ui/pfc-display";
import type { DisplayedMealItem, MealItem } from "../types/meal";

type Props = {
  item: DisplayedMealItem;
  onEdit: (item: MealItem) => void;
};

export const MealItemRow = ({ item, onEdit }: Props) => (
  <button
    type="button"
    className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors active:bg-muted/70 disabled:opacity-60"
    // Still being saved: it has no id to edit yet
    disabled={item.isOptimistic}
    onClick={() => onEdit(item)}
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
);
