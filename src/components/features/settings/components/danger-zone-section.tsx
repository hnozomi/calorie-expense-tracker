"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { useDeleteAllData } from "../hooks/use-delete-all-data";

const CONFIRMATION_TEXT = "全データ削除";

/** Danger zone section with two-step data deletion confirmation */
const DangerZoneSection = () => {
  const { isDeleting, deleteAllData } = useDeleteAllData();
  const [confirmText, setConfirmText] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  /** Handle confirmed deletion */
  const handleDelete = async () => {
    await deleteAllData();
    setConfirmText("");
    setIsOpen(false);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-destructive">危険ゾーン</h3>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              setConfirmText("");
              setIsOpen(true);
            }}
          >
            全データを削除
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>全データを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。食事記録、レシピ、食品マスタ、セットメニュー、献立の全データが完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground">
              確認のため「{CONFIRMATION_TEXT}
              」と入力してください
            </p>
            <Input
              placeholder={CONFIRMATION_TEXT}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={confirmText !== CONFIRMATION_TEXT || isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export { DangerZoneSection };
