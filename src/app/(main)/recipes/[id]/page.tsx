import { Suspense } from "react";
import {
  RecipeFormSection,
  RecipeFormSkeleton,
} from "@/components/features/recipes";

type RecipeDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** Recipe create/edit page */
export default function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  return (
    <Suspense fallback={<RecipeFormSkeleton />}>
      <RecipeFormSection params={params} />
    </Suspense>
  );
}
