import { importHealthDaily } from "@/components/features/health/api/import-health-daily";
import {
  readBearerToken,
  readBodyWithLimit,
} from "@/components/features/health/api/import-request";
import {
  type ImportIssue,
  parseImportBody,
} from "@/components/features/health/api/import-schema";
import { revalidateAllScreens } from "@/lib/revalidate-screens";
import { getTodayInTokyo } from "@/utils";

type ImportResponseBody =
  | { ok: true; received: number; changed: number }
  | { ok: false; error: "unauthorized" | "too_large" | "internal" }
  | { ok: false; error: "invalid_body"; issues: ImportIssue[] };

const respond = (status: number, body: ImportResponseBody): Response =>
  Response.json(body, { status });

const invalidBody = (issues: ImportIssue[]): Response =>
  respond(400, { ok: false, error: "invalid_body", issues });

// Only POST is exported, so Next.js answers other methods with 405.
// Nothing here logs the Authorization header, the body or the RPC arguments; failures log only their kind
export const POST = async (request: Request): Promise<Response> => {
  try {
    const token = readBearerToken(request.headers);
    if (!token) return respond(401, { ok: false, error: "unauthorized" });

    const body = await readBodyWithLimit(request);
    if (body.kind === "too_large") {
      return respond(413, { ok: false, error: "too_large" });
    }
    if (body.kind === "unreadable") {
      return invalidBody([{ path: "", message: "The body is not UTF-8" }]);
    }

    let json: unknown;
    try {
      json = JSON.parse(body.text);
    } catch {
      return invalidBody([{ path: "", message: "The body is not JSON" }]);
    }

    const parsed = parseImportBody(json, getTodayInTokyo());
    if (parsed.kind === "too_large") {
      return respond(413, { ok: false, error: "too_large" });
    }
    if (parsed.kind === "invalid") return invalidBody(parsed.issues);

    const result = await importHealthDaily(token, parsed.records);
    switch (result.kind) {
      case "ok":
        revalidateAllScreens();
        return respond(200, {
          ok: true,
          received: result.received,
          changed: result.changed,
        });
      case "unauthorized":
        return respond(401, { ok: false, error: "unauthorized" });
      case "invalid_records":
        // The function found what the schema let through (e.g. today moved on between the two checks)
        return invalidBody([
          { path: "records", message: "Refused by the import function" },
        ]);
      case "failed":
        return respond(500, { ok: false, error: "internal" });
    }
  } catch (error) {
    console.error("health import failed", {
      kind: error instanceof Error ? error.name : typeof error,
    });
    return respond(500, { ok: false, error: "internal" });
  }
};
