import type { SupabaseClient } from "@supabase/supabase-js";

/** The signed-in user's id, or null. getClaims verifies the JWT locally, so it adds no auth-server round-trip */
export const getSignedInUserId = async (
  supabase: SupabaseClient,
): Promise<string | null> => {
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
};
