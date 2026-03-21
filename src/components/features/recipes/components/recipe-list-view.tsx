"use client";

import { Plus, Search } from "lucide-react";
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
        <div className="sticky top-14 z-30 border-b bg-background px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="レシピ名で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2 p-4">
          {isLoading ? (
            ["s1", "s2", "s3", "s4"].map((key) => (
              <Skeleton key={key} className="h-24 rounded-xl" />
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
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {search
                  ? "該当するレシピが見つかりません"
                  : "レシピがまだ登録されていません"}
              </p>
              {!search && (
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => router.push("/recipes/new")}
                >
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
