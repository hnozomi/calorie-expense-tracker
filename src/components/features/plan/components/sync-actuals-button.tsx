"use client";
// Client because the confirm dialog opens on tap

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type Props = {
  isSyncing: boolean;
  onConfirm: () => void;
};

export const SyncActualsButton = ({ isSyncing, onConfirm }: Props) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button
        size="sm"
        variant="outline"
        className="h-7 rounded-full px-3 text-xs"
        disabled={isSyncing}
      >
        {isSyncing ? "反映中..." : "実績を反映"}
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          実際に食べた内容を献立に反映しますか？
        </AlertDialogTitle>
        <AlertDialogDescription>
          この週の過去の日付について、食事記録がある枠の献立を実際に食べた内容で置き換えます。食事記録がない枠の献立は変更されません。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>キャンセル</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>反映する</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
