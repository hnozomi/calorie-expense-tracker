"use client";

import { BookOpen, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Header, PageContainer } from "@/components/features/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks";
import { useRecipes } from "../hooks/use-recipes";
import { RecipeCard } from "./recipe-card";

/** Recipe list with search and add button */
const RecipeListView = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const { data: recipes, isLoading } = useRecipes(debouncedSearch);

  return (
    <>
      <Header title="レシピ">
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => router.push("/recipes/new")}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </Header>
      <PageContainer>
        <div className="sticky top-14 z-30 bg-background/80 px-4 pb-3 pt-3 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="レシピ名で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full border-muted-foreground/20 bg-muted/50 pl-10 shadow-sm transition-shadow focus:shadow-md"
            />
          </div>
        </div>

        <div className="space-y-2.5 px-4 pb-4 pt-1">
          {isLoading ? (
            ["s1", "s2", "s3", "s4"].map((key) => (
              <Skeleton key={key} className="h-[96px] rounded-xl" />
            ))
          ) : recipes && recipes.length > 0 ? (
            recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => router.push(`/recipes/${recipe.id}`)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <BookOpen className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {search
                  ? "該当するレシピが見つかりません"
                  : "レシピがまだ登録されていません"}
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
                  onClick={() => router.push("/recipes/new")}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  最初のレシピを登録する
                </Button>
              )}
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
};

export { RecipeListView };
