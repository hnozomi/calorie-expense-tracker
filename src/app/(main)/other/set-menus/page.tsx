import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SetMenuListView } from "@/components/features/set-menus";
import { getQueryClient } from "@/lib/get-query-client";
import { prefetchSetMenus } from "@/lib/prefetch";
import { createClient } from "@/lib/supabase/server";

/** Set menus list page — prefetch list server-side */
export default async function SetMenusPage() {
  const queryClient = getQueryClient();
  const supabase = await createClient();

  await prefetchSetMenus(queryClient, supabase);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SetMenuListView />
    </HydrationBoundary>
  );
}
