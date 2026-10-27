import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import {
  FoodMasterListSection,
  FoodMasterListSkeleton,
} from "@/components/features/food-masters";
import { Header, PageContainer } from "@/components/features/layout";
import { Button } from "@/components/ui/button";
import { SearchBoxSkeleton } from "@/components/ui/search-box";

/** 食品マスタ list. The header shows at once; the results wait for ?q= inside Suspense */
const FoodMasterListPage = ({
  searchParams,
}: PageProps<"/other/food-masters">) => {
  return (
    <>
      <Header title="食品マスタ">
        <Button size="icon-sm" variant="ghost" asChild>
          <Link href="/other/food-masters/new" aria-label="食品を登録">
            <Plus className="h-5 w-5" />
          </Link>
        </Button>
      </Header>
      <PageContainer>
        <Suspense
          fallback={
            <>
              <SearchBoxSkeleton />
              <FoodMasterListSkeleton />
            </>
          }
        >
          <FoodMasterListSection searchParams={searchParams} />
        </Suspense>
      </PageContainer>
    </>
  );
};

export default FoodMasterListPage;
