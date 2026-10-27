import { Minus, Plus, X } from "lucide-react";
import type { SetMenuItemDraft } from "@/components/features/set-menus/types/set-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  item: SetMenuItemDraft;
  onAdjustQuantity: (tempId: string, delta: number) => void;
  onRemove: (tempId: string) => void;
};

export const SetMenuItemRow = ({ item, onAdjustQuantity, onRemove }: Props) => (
  <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-white p-3 shadow-sm dark:bg-background">
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {item.recipeId ? "レシピ" : "マスタ"}
        </Badge>
      </div>
      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{Math.round(item.calories * item.servingQuantity)} kcal</span>
        <span>·</span>
        <span>¥{Math.round(item.cost * item.servingQuantity)}</span>
      </div>
    </div>
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="h-7 w-7"
        aria-label={`「${item.name}」を減らす`}
        onClick={() => onAdjustQuantity(item.tempId, -0.5)}
        disabled={item.servingQuantity <= 0.5}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="w-8 text-center text-sm font-medium">
        {item.servingQuantity}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="h-7 w-7"
        aria-label={`「${item.name}」を増やす`}
        onClick={() => onAdjustQuantity(item.tempId, 0.5)}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
      aria-label={`「${item.name}」を外す`}
      onClick={() => onRemove(item.tempId)}
    >
      <X className="h-3.5 w-3.5" />
    </Button>
  </div>
);
