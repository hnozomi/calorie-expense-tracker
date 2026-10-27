"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateAllScreens } from "./revalidate-screens";

/** Re-read every screen after a change made through TanStack Query (the legacy bridge) */
export const revalidateApp = async (): Promise<void> => {
  // A Server Action is a public endpoint; only a signed-in user may drop the cached screens
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims == null) return;
  revalidateAllScreens();
};
