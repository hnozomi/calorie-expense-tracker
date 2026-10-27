import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Header, PageContainer } from "@/components/features/layout";
import {
  RecipeListSection,
  RecipeListSkeleton,
} from "@/components/features/recipes";
import { Button } from "@/components/ui/button";
import { SearchBoxSkeleton } from "@/components/ui/search-box";

/** レシピ list. The header shows at once; the results wait for ?q= inside Suspense */
const RecipeListPage = ({ searchParams }: PageProps<"/recipes">) => {
  return (
    <>
      <Header title="レシピ">
        <Button size="icon-sm" variant="ghost" asChild>
          <Link href="/recipes/new" aria-label="レシピを登録">
            <Plus className="h-5 w-5" />
          </Link>
        </Button>
      </Header>
      <PageContainer>
        <Suspense
          fallback={
            <>
              <SearchBoxSkeleton />
              <RecipeListSkeleton />
            </>
          }
        >
          <RecipeListSection searchParams={searchParams} />
        </Suspense>
      </PageContainer>
    </>
  );
};

export default RecipeListPage;
