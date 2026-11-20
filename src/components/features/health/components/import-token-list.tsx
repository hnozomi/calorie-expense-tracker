"use client";
// Client because revoking shows at once with useOptimistic and the issue dialog is interactive

import { useImportTokens } from "@/components/features/health/hooks/use-import-tokens";
import type { ImportTokenSummary } from "@/components/features/health/types/health-import";
import { MAX_ACTIVE_IMPORT_TOKENS } from "@/components/features/health/utils/import-tokens";
import { ImportTokenRow } from "./import-token-row";
import { IssueImportTokenDialog } from "./issue-import-token-dialog";

type Props = {
  tokens: ImportTokenSummary[];
};

export const ImportTokenList = ({ tokens }: Props) => {
  const {
    shownTokens,
    canIssue,
    confirmingId,
    isRevoking,
    openConfirm,
    cancelConfirm,
    handleRevoke,
  } = useImportTokens(tokens);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium">取り込みトークン</h3>
      {shownTokens.length > 0 ? (
        <ul className="space-y-2" aria-label="取り込みトークン">
          {shownTokens.map((token) => (
            <ImportTokenRow
              key={token.id}
              token={token}
              isConfirming={confirmingId === token.id}
              isRevoking={isRevoking}
              onOpenConfirm={() => openConfirm(token.id)}
              onCancelConfirm={cancelConfirm}
              onConfirm={() => handleRevoke(token.id)}
            />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          まだトークンはありません
        </p>
      )}
      {!canIssue && (
        <p className="text-xs text-muted-foreground">
          有効なトークンは{MAX_ACTIVE_IMPORT_TOKENS}
          件までです。不要なトークンを失効してから発行してください
        </p>
      )}
      <IssueImportTokenDialog canIssue={canIssue} />
    </div>
  );
};
