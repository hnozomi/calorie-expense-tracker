import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SettingsView } from "@/components/features/settings";
import { getQueryClient } from "@/lib/get-query-client";
import { prefetchNutritionTarget } from "@/lib/prefetch";
import { createClient } from "@/lib/supabase/server";

/** Settings page — prefetch nutrition targets server-side */
export default async function SettingsPage() {
  const queryClient = getQueryClient();
  const supabase = await createClient();

  await prefetchNutritionTarget(queryClient, supabase);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SettingsView />
    </HydrationBoundary>
  );
}
