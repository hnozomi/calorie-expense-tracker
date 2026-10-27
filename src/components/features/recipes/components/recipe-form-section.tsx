import { notFound } from "next/navigation";
import { z } from "zod/v4";
import { getRecipe } from "@/components/features/recipes/api/queries";
import { RecipeFormView } from "./recipe-form-view";

type Props = {
  params: Promise<{ id: string }>;
};

// The id is only known per request, so it is read here inside the page's Suspense instead of at the top
// of the page, which would block the prerendered shell. An id that is not a uuid, unknown or deleted is a 404
export const RecipeFormSection = async ({ params }: Props) => {
  const { id } = await params;
  if (id === "new") return <RecipeFormView />;
  if (!z.uuid().safeParse(id).success) notFound();
  const recipe = await getRecipe(id);
  if (!recipe) notFound();
  return <RecipeFormView existing={recipe} />;
};
