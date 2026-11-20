import "server-only";
import { createHash, randomBytes } from "node:crypto";

const TOKEN_PREFIX = "mlg_";
// mlg_ and 4 more characters: enough to tell tokens apart on the screen, not usable to authenticate
const SHOWN_PREFIX_LENGTH = 8;

type ImportToken = {
  token: string;
  tokenHash: string;
  tokenPrefix: string;
};

/**
 * A new import token (256 random bits) with what is stored for it. The token is random rather than a password,
 * so a plain SHA-256 is enough (no slow hash against guessing). The import function hashes the same way in SQL:
 * encode(sha256(convert_to(token, 'UTF8')), 'hex')
 */
export const createImportToken = (): ImportToken => {
  const token = `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  return {
    token,
    tokenHash: createHash("sha256").update(token, "utf8").digest("hex"),
    tokenPrefix: token.slice(0, SHOWN_PREFIX_LENGTH),
  };
};
