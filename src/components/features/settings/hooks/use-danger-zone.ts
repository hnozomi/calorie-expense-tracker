"use client";
// Client because the confirm dialog and typed confirmation are local state

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteAllData } from "@/components/features/settings/api/actions";
import { callAction } from "@/lib/action-result";

export const DELETE_ALL_CONFIRMATION_TEXT = "全データ削除";

/** Deleting everything needs the confirmation words typed; the dialog stays open on failure for a retry */
export const useDangerZone = () => {
  const [confirmText, setConfirmText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, startDeleting] = useTransition();

  const handleDelete = () => {
    startDeleting(async () => {
      const result = await callAction(() => deleteAllData());
      if (!result.ok) {
        toast.error(
          "データの削除に失敗しました。一部のデータのみ削除された可能性があります。もう一度お試しください。",
        );
        return;
      }
      toast.success("全データを削除しました");
      setConfirmText("");
      setIsOpen(false);
    });
  };

  return {
    confirmText,
    isOpen,
    isDeleting,
    canDelete: confirmText === DELETE_ALL_CONFIRMATION_TEXT && !isDeleting,
    handleConfirmTextChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setConfirmText(event.target.value),
    handleOpenChange: setIsOpen,
    openDialog: () => {
      setConfirmText("");
      setIsOpen(true);
    },
    // The dialog's default auto-close is prevented so a failure keeps it open for a retry
    handleDeleteClick: (event: React.MouseEvent) => {
      event.preventDefault();
      handleDelete();
    },
  };
};
