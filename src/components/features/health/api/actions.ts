"use server";

import { z } from "zod/v4";
import { createImportToken } from "@/components/features/health/api/import-token";
import type { ActionResult } from "@/lib/action-result";
import { revalidateAllScreens } from "@/lib/revalidate-screens";
import { createClient } from "@/lib/supabase/server";
import { getSignedInUserId } from "@/lib/supabase/user";

// Action arguments come from the client and can be anything, so every input is parsed here
const issueInputSchema = z.object({
  label: z.string().trim().min(1).max(40),
});

const tokenIdSchema = z.uuid();

/**
 * Issue an import token for the signed-in user. Only its hash and first characters are stored; the plain token
 * is returned here once, for the screen to show, and cannot be read again. Fails when the user already holds
 * 5 tokens that are not revoked (the database refuses the insert)
 */
export const issueImportToken = async (
  input: unknown,
): Promise<ActionResult<{ token: string }>> => {
  const parsed = issueInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) return { ok: false };

  const { token, tokenHash, tokenPrefix } = createImportToken();
  // The error is not logged: Supabase errors can carry the values that were sent
  const { error } = await supabase.from("import_tokens").insert({
    user_id: userId,
    label: parsed.data.label,
    token_hash: tokenHash,
    token_prefix: tokenPrefix,
  });
  if (error) return { ok: false };
  revalidateAllScreens();
  return { ok: true, token };
};

/** Revoke one of the signed-in user's tokens. Fails when there is no such token or it is already revoked */
export const revokeImportToken = async (id: unknown): Promise<ActionResult> => {
  const parsed = tokenIdSchema.safeParse(id);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) return { ok: false };

  const { data, error } = await supabase
    .from("import_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .is("revoked_at", null)
    .select("id");
  if (error || data.length === 0) return { ok: false };
  revalidateAllScreens();
  return { ok: true };
};
