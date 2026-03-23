import { Skeleton } from "@/components/ui/skeleton";

/** Loading skeleton for the food master form view */
const FoodMasterFormSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-10 w-full rounded-lg" />
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-10 w-full rounded-lg" />
  </div>
);

export { FoodMasterFormSkeleton };
