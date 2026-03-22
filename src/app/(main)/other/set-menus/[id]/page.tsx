import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { SetMenuFormView } from "@/components/features/set-menus";
import { getQueryClient } from "@/lib/get-query-client";

type SetMenuDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** Set menu create/edit page */
export default async function SetMenuDetailPage({
  params,
}: SetMenuDetailPageProps) {
  const { id } = await params;
  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SetMenuFormView id={id} />
    </HydrationBoundary>
  );
}
