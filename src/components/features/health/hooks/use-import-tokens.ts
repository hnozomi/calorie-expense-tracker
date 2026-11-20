"use client";
// Client because a revoke shows at once (useOptimistic) and the inline confirm is local state

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { revokeImportToken } from "@/components/features/health/api/actions";
import type { ImportTokenSummary } from "@/components/features/health/types/health-import";
import {
  applyImportTokenRevoke,
  canIssueImportToken,
} from "@/components/features/health/utils/import-tokens";
import { callAction } from "@/lib/action-result";

/** The token list as shown: a revoked token fades at once and comes back if the server refuses */
export const useImportTokens = (tokens: ImportTokenSummary[]) => {
  const [shownTokens, showRevoke] = useOptimistic(
    tokens,
    applyImportTokenRevoke,
  );
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [isRevoking, startRevoking] = useTransition();

  // A token the list shows as revoked has no revoke button, so revoking twice cannot come from this screen.
  // The action answers { ok: false } only for a token it could not revoke (already revoked elsewhere, or gone)
  const handleRevoke = (id: string) => {
    setConfirmingId(null);
    startRevoking(async () => {
      showRevoke({ id, revokedAt: new Date().toISOString() });
      const result = await callAction(() => revokeImportToken(id));
      if (!result.ok) {
        toast.error("トークンを失効できませんでした");
        return;
      }
      toast.success("トークンを失効しました");
    });
  };

  return {
    shownTokens,
    canIssue: canIssueImportToken(shownTokens),
    confirmingId,
    isRevoking,
    openConfirm: setConfirmingId,
    cancelConfirm: () => setConfirmingId(null),
    handleRevoke,
  };
};
