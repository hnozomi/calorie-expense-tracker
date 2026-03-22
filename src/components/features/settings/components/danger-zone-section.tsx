"use client";

import { AlertTriangle } from "lucide-react";
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
import { SectionHeader } from "@/components/ui/section-header";
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
    <section className="space-y-3">
      <SectionHeader
        icon={AlertTriangle}
        label="危険ゾーン"
        iconBgClassName="bg-destructive/10"
        iconClassName="text-destructive"
      />
      <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5">
        <p className="text-xs text-muted-foreground">
          この操作を行うと、すべてのデータが完全に削除されます。元に戻すことはできません。
        </p>
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => {
                setConfirmText("");
                setIsOpen(true);
              }}
            >
              <AlertTriangle className="h-4 w-4" />
              全データを削除
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                全データを削除しますか？
              </AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消せません。食事記録、レシピ、食品マスタ、セットメニュー、献立の全データが完全に削除されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm font-medium text-destructive">
                確認のため「{CONFIRMATION_TEXT}」と入力してください
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
    </section>
  );
};

export { DangerZoneSection };
