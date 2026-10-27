import { Utensils } from "lucide-react";
import { SubmitButton } from "@/components/ui/button/submit-button";
import { InlineDeleteConfirm } from "@/components/ui/inline-delete-confirm";

type Props = {
  isNew: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  itemName: string;
  isDeleteConfirmOpen: boolean;
  onDeleteAsk: () => void;
  onDeleteCancel: () => void;
  onDelete: () => void;
};

export const FoodMasterFormFooter = ({
  isNew,
  isSaving,
  isDeleting,
  itemName,
  isDeleteConfirmOpen,
  onDeleteAsk,
  onDeleteCancel,
  onDelete,
}: Props) => (
  <>
    <SubmitButton
      isPending={isSaving}
      className="w-full py-3 text-base font-semibold shadow-sm"
    >
      {isNew ? (
        <span className="flex items-center gap-2">
          <Utensils className="h-4 w-4" />
          登録する
        </span>
      ) : (
        "変更を保存"
      )}
    </SubmitButton>
    {!isNew && (
      <InlineDeleteConfirm
        triggerLabel="この食品を削除する"
        itemName={itemName}
        description="過去の食事記録は影響を受けません。セットメニューに含まれている場合、既存の内容は保持されますが、新たに追加できなくなります。"
        isOpen={isDeleteConfirmOpen}
        isDeleting={isDeleting}
        onOpen={onDeleteAsk}
        onCancel={onDeleteCancel}
        onConfirm={onDelete}
      />
    )}
  </>
);
