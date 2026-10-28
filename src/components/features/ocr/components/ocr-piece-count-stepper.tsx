import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  pieceCount: number;
  perPieceCalories: number | null;
  eatenCount: number;
  onEatenCountChange: (count: number) => void;
};

/** How many pieces of a per-piece label were eaten, from 1 up to the pieces in the pack */
export const OcrPieceCountStepper = ({
  pieceCount,
  perPieceCalories,
  eatenCount,
  onEatenCountChange,
}: Props) => (
  <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
    <div>
      <p className="text-sm font-medium">食べた数</p>
      <p className="text-xs text-muted-foreground">
        1個あたり{perPieceCalories !== null && ` ${perPieceCalories}kcal`}・
        {pieceCount}個入り
      </p>
    </div>
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="size-11"
        aria-label="食べた数を減らす"
        onClick={() => onEatenCountChange(eatenCount - 1)}
        disabled={eatenCount <= 1}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="w-10 text-center text-sm font-medium" aria-live="polite">
        {eatenCount}個
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="size-11"
        aria-label="食べた数を増やす"
        onClick={() => onEatenCountChange(eatenCount + 1)}
        disabled={eatenCount >= pieceCount}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  </div>
);
