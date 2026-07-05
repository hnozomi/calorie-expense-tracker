"use client";

import { ClipboardList, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Header, PageContainer } from "@/components/features/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSetMenus } from "../hooks/use-set-menus";
import { SetMenuCard } from "./set-menu-card";

/** Set menu list with search and add button */
const SetMenuListView = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data: setMenus } = useSetMenus();

  const normalizedSearch = search.trim().toLowerCase();
  const filteredSetMenus = normalizedSearch
    ? setMenus.filter((setMenu) =>
        setMenu.name.toLowerCase().includes(normalizedSearch),
      )
    : setMenus;

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
        <div className="sticky top-14 z-30 bg-background/80 px-4 pb-3 pt-3 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="セットメニュー名で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full border-muted-foreground/20 bg-muted/50 pl-10 shadow-sm transition-shadow focus:shadow-md"
            />
          </div>
        </div>

        <div className="space-y-2.5 px-4 pb-4 pt-1">
          {filteredSetMenus.length > 0 ? (
            filteredSetMenus.map((sm) => (
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
                {normalizedSearch
                  ? "該当するセットメニューが見つかりません"
                  : "セットメニューがまだ登録されていません"}
              </p>
              {normalizedSearch ? (
                <p className="mt-1 text-xs text-muted-foreground/70">
                  別のキーワードで検索してみてください
                </p>
              ) : (
                <Button
                  variant="outline"
                  className="mt-4 rounded-full"
                  onClick={() => router.push("/other/set-menus/new")}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  最初のセットメニューを登録する
                </Button>
              )}
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
};

export { SetMenuListView };
