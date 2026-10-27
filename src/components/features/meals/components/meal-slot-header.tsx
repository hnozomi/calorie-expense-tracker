import { MEAL_TYPE_LABELS, type MealType } from "@/types";
import { cn, MEAL_TYPE_META } from "@/utils";
import { TransferToPlanButton } from "./transfer-to-plan-button";

type Props = {
  mealType: MealType;
  hasItems: boolean;
  totalCalories: number;
  isTransferring: boolean;
  onTransfer: () => void;
};

export const MealSlotHeader = ({
  mealType,
  hasItems,
  totalCalories,
  isTransferring,
  onTransfer,
}: Props) => {
  const meta = MEAL_TYPE_META[mealType];
  const Icon = meta.icon;

  return (
    <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            meta.iconBg,
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", meta.accent)} />
        </div>
        <span className="text-sm font-semibold">
          {MEAL_TYPE_LABELS[mealType]}
        </span>
      </div>
      {hasItems && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums text-muted-foreground">
            {Math.round(totalCalories)} kcal
          </span>
          <TransferToPlanButton
            mealLabel={MEAL_TYPE_LABELS[mealType]}
            isTransferring={isTransferring}
            onConfirm={onTransfer}
          />
        </div>
      )}
    </div>
  );
};
