import "server-only";
import { z } from "zod/v4";
import type { HealthImportRecord } from "@/components/features/health/api/import-schema";
import { createSessionlessClient } from "@/lib/supabase/sessionless";

const rpcResultSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    received: z.number().int().nonnegative(),
    changed: z.number().int().nonnegative(),
  }),
  z.object({
    ok: z.literal(false),
    error: z.enum(["unauthorized", "invalid_records"]),
  }),
]);

type ImportResult =
  | { kind: "ok"; received: number; changed: number }
  | { kind: "unauthorized" }
  | { kind: "invalid_records" }
  | { kind: "failed" };

/**
 * Write the records as the token owner's health values through import_health_daily (SECURITY DEFINER; the token
 * alone decides whose rows they are). Runs as anon: the request comes from outside the app with no session.
 * Nothing is logged but the kind of failure: the token, the records and Supabase errors (which can carry the
 * arguments) stay out of the logs
 */
export const importHealthDaily = async (
  token: string,
  records: HealthImportRecord[],
): Promise<ImportResult> => {
  const supabase = createSessionlessClient();
  const { data, error } = await supabase.rpc("import_health_daily", {
    p_token: token,
    p_records: records,
  });
  if (error) {
    console.error("import_health_daily failed", { code: error.code });
    return { kind: "failed" };
  }

  const result = rpcResultSchema.safeParse(data);
  if (!result.success) {
    console.error("import_health_daily returned an unexpected shape");
    return { kind: "failed" };
  }
  if (!result.data.ok) return { kind: result.data.error };
  return {
    kind: "ok",
    received: result.data.received,
    changed: result.data.changed,
  };
};
