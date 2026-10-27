import { Suspense } from "react";
import { SearchBox } from "@/components/ui/search-box";
import { RecipeListContent } from "./recipe-list-content";
import { RecipeListSkeleton } from "./recipe-list-skeleton";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const RecipeListSection = async ({ searchParams }: Props) => {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  return (
    <>
      {/* Outside the keyed Suspense: the field keeps focus and the typed text while the results change */}
      <SearchBox
        basePath="/recipes"
        initialQuery={query}
        placeholder="レシピ名で検索..."
      />
      {/* Keyed by the search words: a new search shows the skeleton instead of the previous results */}
      <Suspense key={query} fallback={<RecipeListSkeleton />}>
        <RecipeListContent query={query} />
      </Suspense>
    </>
  );
};
