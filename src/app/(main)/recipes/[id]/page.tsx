import { Suspense } from "react";
import {
  RecipeFormSkeleton,
  RecipeFormView,
} from "@/components/features/recipes";

type RecipeDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** Recipe create/edit page */
export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<RecipeFormSkeleton />}>
      <RecipeFormView id={id} />
    </Suspense>
  );
}
