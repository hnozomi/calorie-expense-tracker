"use client";

import { Plus } from "lucide-react";
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
        <div className="space-y-2 p-4">
          {isLoading ? (
            ["s1", "s2", "s3"].map((key) => (
              <Skeleton key={key} className="h-24 rounded-xl" />
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
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                セットメニューがまだ登録されていません
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => router.push("/other/set-menus/new")}
              >
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
