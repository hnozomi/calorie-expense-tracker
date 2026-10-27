import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MEAL_TYPE_LABELS, type MealType } from "@/types";
import { formatDisplayDate } from "@/utils";

type Props = {
  date: string;
  mealType: MealType;
};

export const PlanMenuDialogHeader = ({ date, mealType }: Props) => (
  <DialogHeader className="space-y-1">
    <DialogTitle className="flex items-center gap-2 text-base">
      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary">
        {MEAL_TYPE_LABELS[mealType]}
      </span>
      <span className="text-muted-foreground">{formatDisplayDate(date)}</span>
    </DialogTitle>
    <DialogDescription className="text-xs">
      献立のメニューを選択または入力してください
    </DialogDescription>
  </DialogHeader>
);
