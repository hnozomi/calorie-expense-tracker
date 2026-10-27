"use client";
// Client because it is a controlled confirm dialog

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

type Props = {
  isOpen: boolean;
  draftCount: number;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
};

export const DiscardDraftsDialog = ({
  isOpen,
  draftCount,
  onOpenChange,
  onDiscard,
}: Props) => (
  <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>入力中のアイテムを破棄しますか?</AlertDialogTitle>
        <AlertDialogDescription>
          {draftCount > 0
            ? `追加した${draftCount}件のアイテムはまだ登録されていません。閉じると破棄されます。`
            : "入力中の内容はまだカードに追加されていません。閉じると破棄されます。"}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>入力を続ける</AlertDialogCancel>
        <AlertDialogAction onClick={onDiscard}>
          破棄して閉じる
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
