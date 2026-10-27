import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  triggerLabel: string;
  itemName: string;
  description: string;
  isOpen: boolean;
  isDeleting: boolean;
  onOpen: () => void;
  onCancel: () => void;
  onConfirm: () => void;
};

/** A delete link that turns into a confirm box in place, so the form stays in view */
export const InlineDeleteConfirm = ({
  triggerLabel,
  itemName,
  description,
  isOpen,
  isDeleting,
  onOpen,
  onCancel,
  onConfirm,
}: Props) => (
  <div className="pt-2">
    {!isOpen ? (
      <button
        type="button"
        className="flex w-full items-center justify-center gap-1.5 py-2 text-sm text-muted-foreground transition-colors hover:text-destructive"
        onClick={onOpen}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {triggerLabel}
      </button>
    ) : (
      <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium">
              「{itemName}」を削除しますか？
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onCancel}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="flex-1"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? "削除中..." : "削除する"}
          </Button>
        </div>
      </div>
    )}
  </div>
);
