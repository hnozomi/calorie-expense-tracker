"use client";

import { ClipboardList, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Header, PageContainer } from "@/components/features/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSetMenus } from "../hooks/use-set-menus";
import { SetMenuCard } from "./set-menu-card";

/** Set menu list with add button */
const SetMenuListView = () => {
  const router = useRouter();
  const { data: setMenus, isLoading } = useSetMenus();

  return (
    <>
      <Header title="セットメニュー">
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => router.push("/other/set-menus/new")}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </Header>
      <PageContainer>
        <div className="space-y-2.5 px-4 pb-4 pt-4">
          {isLoading ? (
            ["s1", "s2", "s3"].map((key) => (
              <Skeleton key={key} className="h-[96px] rounded-xl" />
            ))
          ) : setMenus && setMenus.length > 0 ? (
            setMenus.map((sm) => (
              <SetMenuCard
                key={sm.id}
                setMenu={sm}
                onClick={() => router.push(`/other/set-menus/${sm.id}`)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ClipboardList className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                セットメニューがまだ登録されていません
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-full"
                onClick={() => router.push("/other/set-menus/new")}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                最初のセットメニューを登録する
              </Button>
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
};

export { SetMenuListView };
