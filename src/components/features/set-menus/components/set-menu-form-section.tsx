import { notFound } from "next/navigation";
import { z } from "zod/v4";
import { getFoodMasters } from "@/components/features/food-masters/api/queries";
import { getRecipes } from "@/components/features/recipes/api/queries";
import { getSetMenu } from "@/components/features/set-menus/api/queries";
import { SetMenuFormView } from "./set-menu-form-view";

type Props = {
  params: Promise<{ id: string }>;
};

// The id is only known per request, so it is read here inside the page's Suspense instead of at the top
// of the page, which would block the prerendered shell. An id that is not a uuid, unknown or deleted is a 404
export const SetMenuFormSection = async ({ params }: Props) => {
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !z.uuid().safeParse(id).success) notFound();
  const [setMenu, recipes, foodMasters] = await Promise.all([
    isNew ? null : getSetMenu(id),
    getRecipes(),
    getFoodMasters(),
  ]);
  if (!isNew && !setMenu) notFound();
  return (
    <SetMenuFormView
      existing={setMenu ?? undefined}
      recipes={recipes}
      foodMasters={foodMasters}
    />
  );
};
