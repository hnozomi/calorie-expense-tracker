import { Suspense } from "react";
import {
  RecipeFormSection,
  RecipeFormSkeleton,
} from "@/components/features/recipes";

type Props = {
  params: Promise<{ id: string }>;
};

/** Recipe create/edit page */
const RecipeDetailPage = ({ params }: Props) => {
  return (
    <Suspense fallback={<RecipeFormSkeleton />}>
      <RecipeFormSection params={params} />
    </Suspense>
  );
};

export default RecipeDetailPage;
