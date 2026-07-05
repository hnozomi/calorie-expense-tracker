"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type UnsavedChangesDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
};

/** Confirmation dialog shown when leaving a form with unsaved changes */
const UnsavedChangesDialog = ({
  isOpen,
  onOpenChange,
  onDiscard,
}: UnsavedChangesDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>変更を破棄しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            保存されていない変更があります。このまま戻ると入力内容は失われます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>編集を続ける</AlertDialogCancel>
          <AlertDialogAction onClick={onDiscard}>
            破棄して戻る
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { UnsavedChangesDialog };
