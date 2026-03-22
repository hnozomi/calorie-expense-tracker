import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { FoodMasterFormView } from "@/components/features/food-masters";
import { getQueryClient } from "@/lib/get-query-client";
import { prefetchFoodMasterDetail } from "@/lib/prefetch";
import { createClient } from "@/lib/supabase/server";

type FoodMasterDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** Food master create/edit page — prefetch detail for existing items */
export default async function FoodMasterDetailPage({
  params,
}: FoodMasterDetailPageProps) {
  const { id } = await params;
  const queryClient = getQueryClient();

  if (id !== "new") {
    const supabase = await createClient();
    await prefetchFoodMasterDetail(queryClient, supabase, id);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FoodMasterFormView id={id} />
    </HydrationBoundary>
  );
}
