import { Suspense } from "react";
import {
  FoodMasterFormSection,
  FoodMasterFormSkeleton,
} from "@/components/features/food-masters";

type Props = {
  params: Promise<{ id: string }>;
};

/** Food master create/edit page */
const FoodMasterDetailPage = ({ params }: Props) => {
  return (
    <Suspense fallback={<FoodMasterFormSkeleton />}>
      <FoodMasterFormSection params={params} />
    </Suspense>
  );
};

export default FoodMasterDetailPage;
