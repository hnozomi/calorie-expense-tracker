import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { getRecipes } from "@/components/features/recipes/api/queries";
import { Button } from "@/components/ui/button";
import { matchesSearch } from "@/utils";
import { RecipeCard } from "./recipe-card";

type Props = {
  query: string;
};

// The whole list is already read (and cached) for the other screens, so the search narrows it here instead of asking the DB again
export const RecipeListContent = async ({ query }: Props) => {
  const recipes = (await getRecipes()).filter((recipe) =>
    matchesSearch([recipe.name], query),
  );

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center py-16">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <BookOpen className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {query
            ? "該当するレシピが見つかりません"
            : "レシピがまだ登録されていません"}
        </p>
        {query ? (
          <p className="mt-1 text-xs text-muted-foreground/70">
            別のキーワードで検索してみてください
          </p>
        ) : (
          <Button variant="outline" className="mt-4 rounded-full" asChild>
            <Link href="/recipes/new">
              <Plus className="mr-1.5 h-4 w-4" />
              最初のレシピを登録する
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2.5 px-4 pb-4 pt-1">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          href={`/recipes/${recipe.id}`}
        />
      ))}
    </div>
  );
};
