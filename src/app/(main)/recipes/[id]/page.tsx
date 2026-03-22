import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { RecipeFormView } from "@/components/features/recipes";
import { getQueryClient } from "@/lib/get-query-client";
import { prefetchRecipeDetail } from "@/lib/prefetch";
import { createClient } from "@/lib/supabase/server";

type RecipeDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** Recipe create/edit page — prefetch detail for existing recipes */
export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const { id } = await params;
  const queryClient = getQueryClient();

  if (id !== "new") {
    const supabase = await createClient();
    await prefetchRecipeDetail(queryClient, supabase, id);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecipeFormView id={id} />
    </HydrationBoundary>
  );
}
