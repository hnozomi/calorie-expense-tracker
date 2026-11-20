"use client";
// Client because the dialog, the typed label and the token shown once are local state

import { Copy, KeyRound } from "lucide-react";
import { useIssueImportToken } from "@/components/features/health/hooks/use-issue-import-token";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  canIssue: boolean;
};

export const IssueImportTokenDialog = ({ canIssue }: Props) => {
  const {
    isOpen,
    label,
    labelError,
    issuedToken,
    isIssuing,
    openDialog,
    handleOpenChange,
    handleLabelChange,
    handleIssue,
    handleCopy,
  } = useIssueImportToken();

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        disabled={!canIssue}
        onClick={openDialog}
      >
        <KeyRound className="h-4 w-4" />
        トークンを発行
      </Button>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm">
          {issuedToken ? (
            <>
              <DialogHeader>
                <DialogTitle>トークンを発行しました</DialogTitle>
                <DialogDescription>
                  この画面を閉じると二度と表示できません。コピーして、取り込みの仕組みに登録してください。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="issued-import-token" className="text-xs">
                  発行したトークン
                </Label>
                <Textarea
                  id="issued-import-token"
                  readOnly
                  rows={2}
                  value={issuedToken}
                  className="resize-none font-mono text-xs break-all"
                  onFocus={(event) => event.target.select()}
                />
              </div>
              <DialogFooter>
                <Button type="button" className="gap-2" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                  コピー
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  閉じる
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={handleIssue} className="space-y-4">
              <DialogHeader>
                <DialogTitle>トークンを発行</DialogTitle>
                <DialogDescription>
                  どこで使うトークンか分かる名前を付けてください。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="import-token-label" className="text-xs">
                  ラベル
                </Label>
                <Input
                  id="import-token-label"
                  placeholder="例：もち"
                  autoComplete="off"
                  maxLength={40}
                  value={label}
                  onChange={handleLabelChange}
                  aria-invalid={!!labelError}
                  aria-describedby={
                    labelError ? "import-token-label-error" : undefined
                  }
                />
                {labelError && (
                  <p
                    id="import-token-label-error"
                    className="text-xs text-destructive"
                  >
                    {labelError}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isIssuing}>
                  {isIssuing ? "発行中..." : "発行"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
