import { CopyPlus, Plus } from "lucide-react";

type Props = {
  isCopying: boolean;
  onRegister: () => void;
  onCopyPreviousDay: () => void;
};

export const EmptySlotActions = ({
  isCopying,
  onRegister,
  onCopyPreviousDay,
}: Props) => (
  <>
    <button
      type="button"
      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/20 py-4 text-sm text-muted-foreground transition-colors active:bg-muted/60"
      onClick={onRegister}
    >
      <Plus className="h-4 w-4" />
      登録する
    </button>
    <button
      type="button"
      className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs text-muted-foreground/80 transition-colors active:bg-muted/60 disabled:opacity-50"
      onClick={onCopyPreviousDay}
      disabled={isCopying}
    >
      <CopyPlus className="h-3.5 w-3.5" />
      {isCopying ? "コピー中..." : "前日をコピー"}
    </button>
  </>
);
