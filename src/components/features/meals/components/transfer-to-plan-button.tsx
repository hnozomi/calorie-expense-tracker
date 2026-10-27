"use client";
// Client because the confirm dialog opens on tap

import { CalendarPlus } from "lucide-react";
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

type Props = {
  mealLabel: string;
  isTransferring: boolean;
  onConfirm: () => void;
};

export const TransferToPlanButton = ({
  mealLabel,
  isTransferring,
  onConfirm,
}: Props) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <button
        type="button"
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground active:bg-muted/80"
        disabled={isTransferring}
        title="献立に反映"
        aria-label="献立に反映"
      >
        <CalendarPlus className="h-3.5 w-3.5" />
      </button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>献立に反映しますか？</AlertDialogTitle>
        <AlertDialogDescription>
          この{mealLabel}の内容を献立カレンダーに追加します。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>キャンセル</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>反映する</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
