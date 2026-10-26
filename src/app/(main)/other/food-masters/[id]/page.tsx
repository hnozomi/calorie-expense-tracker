import { Suspense } from "react";
import {
  FoodMasterFormSection,
  FoodMasterFormSkeleton,
} from "@/components/features/food-masters";

type FoodMasterDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** Food master create/edit page */
export default function FoodMasterDetailPage({
  params,
}: FoodMasterDetailPageProps) {
  return (
    <Suspense fallback={<FoodMasterFormSkeleton />}>
      <FoodMasterFormSection params={params} />
    </Suspense>
  );
}
