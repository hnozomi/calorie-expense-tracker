import { Suspense } from "react";
import { SearchBox } from "@/components/ui/search-box";
import { FoodMasterListContent } from "./food-master-list-content";
import { FoodMasterListSkeleton } from "./food-master-list-skeleton";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const FoodMasterListSection = async ({ searchParams }: Props) => {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  return (
    <>
      {/* Outside the keyed Suspense: the field keeps focus and the typed text while the results change */}
      <SearchBox
        basePath="/other/food-masters"
        initialQuery={query}
        placeholder="食品名・ブランドで検索..."
      />
      {/* Keyed by the search words: a new search shows the skeleton instead of the previous results */}
      <Suspense key={query} fallback={<FoodMasterListSkeleton />}>
        <FoodMasterListContent query={query} />
      </Suspense>
    </>
  );
};
