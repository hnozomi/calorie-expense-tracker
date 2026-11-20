const MAX_IMPORT_BODY_BYTES = 64 * 1024;

const BEARER_PATTERN = /^Bearer +(\S+)$/i;

/**
 * The token of an `Authorization: Bearer <token>` header, or null. Only the header is read: a token in the
 * query string would be kept in access logs
 */
export const readBearerToken = (headers: Headers): string | null =>
  headers.get("authorization")?.match(BEARER_PATTERN)?.[1] ?? null;

type ReadBodyResult =
  | { kind: "ok"; text: string }
  | { kind: "too_large" }
  | { kind: "unreadable" };

/** The body as UTF-8 text, read only up to the limit so a large body is refused without holding all of it */
export const readBodyWithLimit = async (
  request: Request,
  limitBytes: number = MAX_IMPORT_BODY_BYTES,
): Promise<ReadBodyResult> => {
  const declaredLength = Number(request.headers.get("content-length"));
  if (declaredLength > limitBytes) return { kind: "too_large" };
  if (!request.body) return { kind: "ok", text: "" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limitBytes) {
      await reader.cancel();
      return { kind: "too_large" };
    }
    chunks.push(value);
  }

  try {
    return {
      kind: "ok",
      text: new TextDecoder("utf-8", { fatal: true }).decode(
        Buffer.concat(chunks),
      ),
    };
  } catch {
    return { kind: "unreadable" };
  }
};
