"use client";

import { Plus, Search, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Header, PageContainer } from "@/components/features/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks";
import { useFoodMasters } from "../hooks/use-food-masters";
import { FoodMasterCard } from "./food-master-card";

/** Food master list with search and add button */
const FoodMasterListView = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const { data: foodMasters, isLoading } = useFoodMasters(debouncedSearch);

  return (
    <>
      <Header title="食品マスタ">
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => router.push("/other/food-masters/new")}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </Header>
      <PageContainer>
        <div className="sticky top-14 z-30 bg-background/80 px-4 pb-3 pt-3 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="食品名で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full border-muted-foreground/20 bg-muted/50 pl-10 shadow-sm transition-shadow focus:shadow-md"
            />
          </div>
        </div>

        <div className="space-y-2.5 px-4 pb-4 pt-1">
          {isLoading ? (
            ["s1", "s2", "s3", "s4", "s5"].map((key) => (
              <Skeleton key={key} className="h-[88px] rounded-xl" />
            ))
          ) : foodMasters && foodMasters.length > 0 ? (
            foodMasters.map((fm) => (
              <FoodMasterCard
                key={fm.id}
                foodMaster={fm}
                onClick={() => router.push(`/other/food-masters/${fm.id}`)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <UtensilsCrossed className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {search
                  ? "該当する食品が見つかりません"
                  : "食品マスタがまだ登録されていません"}
              </p>
              {search && (
                <p className="mt-1 text-xs text-muted-foreground/70">
                  別のキーワードで検索してみてください
                </p>
              )}
              {!search && (
                <Button
                  variant="outline"
                  className="mt-4 rounded-full"
                  onClick={() => router.push("/other/food-masters/new")}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  最初の食品を登録する
                </Button>
              )}
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
};

export { FoodMasterListView };
