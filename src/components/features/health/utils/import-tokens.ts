import type {
  ImportTokenRevoke,
  ImportTokenSummary,
} from "@/components/features/health/types/health-import";

// The database refuses a sixth token that is not revoked (add_import_tokens). The screen uses the same number
// to say why it cannot issue one, instead of a failure after the user typed a label
export const MAX_ACTIVE_IMPORT_TOKENS = 5;

export const isImportTokenRevoked = (token: ImportTokenSummary): boolean =>
  token.revokedAt !== null;

const countActiveImportTokens = (tokens: ImportTokenSummary[]): number =>
  tokens.filter((token) => !isImportTokenRevoked(token)).length;

export const canIssueImportToken = (tokens: ImportTokenSummary[]): boolean =>
  countActiveImportTokens(tokens) < MAX_ACTIVE_IMPORT_TOKENS;

/** The list with one token marked revoked; a token already revoked keeps the time it was revoked */
export const applyImportTokenRevoke = (
  tokens: ImportTokenSummary[],
  revoke: ImportTokenRevoke,
): ImportTokenSummary[] =>
  tokens.map((token) =>
    token.id === revoke.id && !isImportTokenRevoked(token)
      ? { ...token, revokedAt: revoke.revokedAt }
      : token,
  );
