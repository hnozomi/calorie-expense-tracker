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
import { Button } from "@/components/ui/button";

type Props = {
  /** Names typed but never added to the card; null while the dialog is closed */
  pendingNames: string[] | null;
  onOpenChange: (open: boolean) => void;
  onRegisterWithoutPending: () => void;
  onRegisterWithPending: () => void;
};

export const PendingInputDialog = ({
  pendingNames,
  onOpenChange,
  onRegisterWithoutPending,
  onRegisterWithPending,
}: Props) => (
  <AlertDialog open={pendingNames !== null} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>入力中のアイテムがあります</AlertDialogTitle>
        <AlertDialogDescription>
          {pendingNames?.map((name) => `「${name}」`).join("、")}
          はまだカードに追加されていません。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>キャンセル</AlertDialogCancel>
        <Button variant="outline" onClick={onRegisterWithoutPending}>
          追加せずに登録
        </Button>
        <AlertDialogAction onClick={onRegisterWithPending}>
          追加して登録
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
