import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Header, PageContainer } from "@/components/features/layout";
import {
  SetMenuListSection,
  SetMenuListSkeleton,
} from "@/components/features/set-menus";
import { Button } from "@/components/ui/button";
import { SearchBoxSkeleton } from "@/components/ui/search-box";

/** S-06: Set menu list. The header shows at once; the results wait for ?q= inside Suspense */
const SetMenuListPage = ({ searchParams }: PageProps<"/other/set-menus">) => {
  return (
    <>
      <Header title="セットメニュー">
        <Button size="icon-sm" variant="ghost" asChild>
          <Link href="/other/set-menus/new" aria-label="セットメニューを登録">
            <Plus className="h-5 w-5" />
          </Link>
        </Button>
      </Header>
      <PageContainer>
        <Suspense
          fallback={
            <>
              <SearchBoxSkeleton />
              <SetMenuListSkeleton />
            </>
          }
        >
          <SetMenuListSection searchParams={searchParams} />
        </Suspense>
      </PageContainer>
    </>
  );
};

export default SetMenuListPage;
