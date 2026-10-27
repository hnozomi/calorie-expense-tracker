import {
  formatShoppingQuantity,
  type ShoppingListEntry,
} from "@/components/features/plan/utils/shopping-list";
import { cn } from "@/utils";

type Props = {
  entry: ShoppingListEntry;
  isChecked: boolean;
  onToggle: (entryKey: string) => void;
};

export const ShoppingListRow = ({ entry, isChecked, onToggle }: Props) => (
  <li>
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
        onChange={() => onToggle(entry.key)}
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
