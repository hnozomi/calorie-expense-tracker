"use client";
// Client because the dialog, the typed label and the token shown once are local state

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { z } from "zod/v4";
import { issueImportToken } from "@/components/features/health/api/actions";
import { callAction } from "@/lib/action-result";

const labelSchema = z
  .string()
  .trim()
  .min(1, "ラベルを入力してください")
  .max(40, "ラベルは40文字以内で入力してください");

/**
 * Issuing a token in a dialog: a label, then the plain token shown once. The token lives only in this state
 * and is dropped when the dialog closes, so it can never be shown again
 */
export const useIssueImportToken = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [labelError, setLabelError] = useState<string | null>(null);
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [isIssuing, startIssuing] = useTransition();

  const reset = () => {
    setLabel("");
    setLabelError(null);
    setIssuedToken(null);
  };

  const handleIssue = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = labelSchema.safeParse(label);
    if (!parsed.success) {
      setLabelError(parsed.error.issues[0]?.message ?? null);
      return;
    }
    setLabelError(null);
    startIssuing(async () => {
      const result = await callAction(() =>
        issueImportToken({ label: parsed.data }),
      );
      if (!result.ok) {
        toast.error("トークンを発行できませんでした");
        return;
      }
      setIssuedToken(result.token);
    });
  };

  const handleCopy = async () => {
    if (!issuedToken) return;
    try {
      await navigator.clipboard.writeText(issuedToken);
      toast.success("コピーしました");
    } catch {
      toast.error("コピーできませんでした。値を選んでコピーしてください");
    }
  };

  return {
    isOpen,
    label,
    labelError,
    issuedToken,
    isIssuing,
    openDialog: () => {
      reset();
      setIsOpen(true);
    },
    // Closing while the token is being issued would issue one that is never shown
    handleOpenChange: (open: boolean) => {
      if (!open && isIssuing) return;
      setIsOpen(open);
      if (!open) reset();
    },
    handleLabelChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setLabel(event.target.value),
    handleIssue,
    handleCopy,
  };
};
