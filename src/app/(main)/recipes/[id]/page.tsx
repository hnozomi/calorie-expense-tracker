"use client";

import { useParams } from "next/navigation";
import { RecipeFormView } from "@/components/features/recipes";

/** Recipe create/edit page */
export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  return <RecipeFormView id={params.id} />;
}
