import { Suspense } from "react";
import {
  RecipeListSkeleton,
  RecipeListView,
} from "@/components/features/recipes";

/** Recipes list page */
export default function RecipesPage() {
  return (
    <Suspense fallback={<RecipeListSkeleton />}>
      <RecipeListView />
    </Suspense>
  );
}
