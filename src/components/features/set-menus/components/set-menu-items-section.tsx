import { ClipboardList } from "lucide-react";
import type { SetMenuItemDraft } from "@/components/features/set-menus/types/set-menu";
import { scaledItemValues } from "@/components/features/set-menus/utils/display-values";
import { SectionHeader } from "@/components/ui/section-header";
import { SetMenuItemRow } from "./set-menu-item-row";
import { SetMenuTotals } from "./set-menu-totals";

type Props = {
  items: SetMenuItemDraft[];
  totals: React.ComponentProps<typeof SetMenuTotals>["totals"];
  onAdjustQuantity: (tempId: string, delta: number) => void;
  onRemove: (tempId: string) => void;
};

export const SetMenuItemsSection = ({
  items,
  totals,
  onAdjustQuantity,
  onRemove,
}: Props) => (
  <section className="space-y-3">
    <SectionHeader icon={ClipboardList} label="メニュー内容" />
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
      {items.length > 0 ? (
        <>
          <div className="space-y-2">
            {items.map((item) => (
              <SetMenuItemRow
                key={item.tempId}
                item={item}
                scaled={scaledItemValues(item)}
                onAdjustQuantity={onAdjustQuantity}
                onRemove={onRemove}
              />
            ))}
          </div>
          <SetMenuTotals totals={totals} />
        </>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          下の「アイテムを追加」からメニューを構成してください
        </p>
      )}
    </div>
  </section>
);
