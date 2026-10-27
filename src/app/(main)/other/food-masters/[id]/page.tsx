import { Suspense } from "react";
import {
  FoodMasterFormSection,
  FoodMasterFormSkeleton,
} from "@/components/features/food-masters";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Food master create/edit page */
const FoodMasterDetailPage = ({ params, searchParams }: Props) => {
  return (
    <Suspense fallback={<FoodMasterFormSkeleton />}>
      <FoodMasterFormSection params={params} searchParams={searchParams} />
    </Suspense>
  );
};

export default FoodMasterDetailPage;
