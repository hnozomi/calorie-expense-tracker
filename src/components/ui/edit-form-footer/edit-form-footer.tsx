import { Utensils } from "lucide-react";
import { SubmitButton } from "@/components/ui/button/submit-button";
import { InlineDeleteConfirm } from "@/components/ui/inline-delete-confirm";

type Props = {
  isNew: boolean;
  /** e.g. このレシピを削除する */
  deleteLabel: string;
  deleteDescription: string;
  isSaving: boolean;
  isDeleting: boolean;
  itemName: string;
  isDeleteConfirmOpen: boolean;
  onDeleteAsk: () => void;
  onDeleteCancel: () => void;
  onDelete: () => void;
};

/** The submit button (登録する on a new record, 変更を保存 on an edit) and, when editing, the delete confirm */
export const EditFormFooter = ({
  isNew,
  deleteLabel,
  deleteDescription,
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
        triggerLabel={deleteLabel}
        itemName={itemName}
        description={deleteDescription}
        isOpen={isDeleteConfirmOpen}
        isDeleting={isDeleting}
        onOpen={onDeleteAsk}
        onCancel={onDeleteCancel}
        onConfirm={onDelete}
      />
    )}
  </>
);
