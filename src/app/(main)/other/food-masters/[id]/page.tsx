import { Suspense } from "react";
import {
  FoodMasterFormSkeleton,
  FoodMasterFormView,
} from "@/components/features/food-masters";

type FoodMasterDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** Food master create/edit page */
export default async function FoodMasterDetailPage({
  params,
}: FoodMasterDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<FoodMasterFormSkeleton />}>
      <FoodMasterFormView id={id} />
    </Suspense>
  );
}
