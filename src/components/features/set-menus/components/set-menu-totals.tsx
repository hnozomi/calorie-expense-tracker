import { PfcDot } from "@/components/ui/pfc-display";

type Props = {
  totals: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    cost: number;
  };
};

export const SetMenuTotals = ({ totals }: Props) => (
  <div className="rounded-lg bg-muted/60 p-3">
    <p className="text-sm font-medium">
      合計: {Math.round(totals.calories)} kcal · ¥{Math.round(totals.cost)}
    </p>
    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <PfcDot color="bg-blue-500" />
        P:
        {totals.protein.toFixed(1)}
      </span>
      <span className="flex items-center gap-1">
        <PfcDot color="bg-amber-500" />
        F:
        {totals.fat.toFixed(1)}
      </span>
      <span className="flex items-center gap-1">
        <PfcDot color="bg-green-500" />
        C:
        {totals.carbs.toFixed(1)}
      </span>
    </div>
  </div>
);
