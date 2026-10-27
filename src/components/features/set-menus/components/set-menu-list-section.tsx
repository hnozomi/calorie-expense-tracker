import { Suspense } from "react";
import { SearchBox } from "@/components/ui/search-box";
import { SetMenuListContent } from "./set-menu-list-content";
import { SetMenuListSkeleton } from "./set-menu-list-skeleton";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const SetMenuListSection = async ({ searchParams }: Props) => {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  return (
    <>
      {/* Outside the keyed Suspense: the field keeps focus and the typed text while the results change */}
      <SearchBox
        basePath="/other/set-menus"
        initialQuery={query}
        placeholder="セットメニュー名で検索..."
      />
      {/* Keyed by the search words: a new search shows the skeleton instead of the previous results */}
      <Suspense key={query} fallback={<SetMenuListSkeleton />}>
        <SetMenuListContent query={query} />
      </Suspense>
    </>
  );
};
