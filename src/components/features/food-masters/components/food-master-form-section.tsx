import { FoodMasterFormView } from "./food-master-form-view";

type Props = {
  params: Promise<{ id: string }>;
};

// The id is only known per request, so it is read here inside the page's Suspense
// instead of at the top of the page, which would block the prerendered shell
export const FoodMasterFormSection = async ({ params }: Props) => {
  const { id } = await params;
  return <FoodMasterFormView id={id} />;
};
