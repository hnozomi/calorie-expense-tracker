import { Button } from "@/components/ui/button";

type Props = {
  itemName: string;
  isConfirmOpen: boolean;
  onAsk: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

// Confirms inline instead of a second dialog, so the edit drawer underneath stays in view
export const DeleteItemSection = ({
  itemName,
  isConfirmOpen,
  onAsk,
  onCancel,
  onDelete,
}: Props) =>
  isConfirmOpen ? (
    <div className="mt-4 space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
      <p className="text-sm font-medium">「{itemName}」を削除しますか？</p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onCancel}
        >
          キャンセル
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1"
          onClick={onDelete}
        >
          削除する
        </Button>
      </div>
    </div>
  ) : (
    <button
      type="button"
      className="mt-4 w-full text-center text-sm text-destructive transition-colors hover:text-destructive/80 hover:underline"
      onClick={onAsk}
    >
      このアイテムを削除する
    </button>
  );
