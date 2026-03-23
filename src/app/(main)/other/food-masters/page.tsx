import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { FoodMasterListView } from "@/components/features/food-masters";
import { getQueryClient } from "@/lib/get-query-client";
import { prefetchFoodMasters } from "@/lib/prefetch";
import { createClient } from "@/lib/supabase/server";

/** Food masters list page — prefetch list server-side */
export default async function FoodMastersPage() {
  const queryClient = getQueryClient();
  const supabase = await createClient();

  /** Prefetch data so dehydrate() captures it in the cache */
  await prefetchFoodMasters(queryClient, supabase);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FoodMasterListView />
    </HydrationBoundary>
  );
}
