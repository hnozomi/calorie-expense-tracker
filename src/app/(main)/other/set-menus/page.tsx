import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { SetMenuListView } from "@/components/features/set-menus";
import { Skeleton } from "@/components/ui/skeleton";
import { getQueryClient } from "@/lib/get-query-client";
import { prefetchSetMenus } from "@/lib/prefetch";
import { createClient } from "@/lib/supabase/server";

/** Set menus list page — prefetch list server-side */
export default async function SetMenusPage() {
  const queryClient = getQueryClient();
  const supabase = await createClient();

  /** Prefetch data so dehydrate() captures it in the cache */
  await prefetchSetMenus(queryClient, supabase);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className="space-y-2.5 px-4 pt-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[96px] rounded-xl" />
            ))}
          </div>
        }
      >
        <SetMenuListView />
      </Suspense>
    </HydrationBoundary>
  );
}
