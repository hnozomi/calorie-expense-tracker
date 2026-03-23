import { Suspense } from "react";
import {
  FoodMasterListSkeleton,
  FoodMasterListView,
} from "@/components/features/food-masters";

/** Food masters list page */
export default function FoodMastersPage() {
  return (
    <Suspense fallback={<FoodMasterListSkeleton />}>
      <FoodMasterListView />
    </Suspense>
  );
}
