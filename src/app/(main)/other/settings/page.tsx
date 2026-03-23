import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { SettingsView } from "@/components/features/settings";
import { Skeleton } from "@/components/ui/skeleton";
import { getQueryClient } from "@/lib/get-query-client";
import { prefetchNutritionTarget } from "@/lib/prefetch";
import { createClient } from "@/lib/supabase/server";

/** Settings page — prefetch nutrition targets server-side */
export default async function SettingsPage() {
  const queryClient = getQueryClient();
  const supabase = await createClient();

  /** Prefetch data so dehydrate() captures it in the cache */
  await prefetchNutritionTarget(queryClient, supabase);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className="space-y-6 p-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        }
      >
        <SettingsView />
      </Suspense>
    </HydrationBoundary>
  );
}
