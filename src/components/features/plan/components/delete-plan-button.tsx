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

type Props = {
  plannedName: string;
  onDelete: () => void;
};

export const DeletePlanButton = ({ plannedName, onDelete }: Props) => (
  <div className="mt-3 border-t border-border/40 pt-3">
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="w-full rounded-md py-2 text-center text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          この献立を削除する
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>献立を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{plannedName}」を削除します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            削除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);
