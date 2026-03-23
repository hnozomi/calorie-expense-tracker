import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { RecipeListView } from "@/components/features/recipes";
import { getQueryClient } from "@/lib/get-query-client";
import { prefetchRecipes } from "@/lib/prefetch";
import { createClient } from "@/lib/supabase/server";

/** Recipes list page — prefetch initial list server-side */
export default async function RecipesPage() {
  const queryClient = getQueryClient();
  const supabase = await createClient();

  /** Prefetch data so dehydrate() captures it in the cache */
  await prefetchRecipes(queryClient, supabase);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecipeListView />
    </HydrationBoundary>
  );
}
