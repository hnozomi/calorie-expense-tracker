"use client";

import { Plus, Search } from "lucide-react";
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
        <div className="sticky top-14 z-30 border-b bg-background px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="食品名で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2 p-4">
          {isLoading ? (
            ["s1", "s2", "s3", "s4", "s5"].map((key) => (
              <Skeleton key={key} className="h-20 rounded-xl" />
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
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {search
                  ? "該当する食品が見つかりません"
                  : "食品マスタがまだ登録されていません"}
              </p>
              {!search && (
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => router.push("/other/food-masters/new")}
                >
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
