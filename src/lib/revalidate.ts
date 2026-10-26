"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Re-read every screen after a change: screens prefetched earlier would otherwise keep the old data */
export const revalidateApp = async (): Promise<void> => {
  // A Server Action is a public endpoint; only a signed-in user may drop the cached screens
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims == null) return;
  revalidatePath("/", "layout");
};
