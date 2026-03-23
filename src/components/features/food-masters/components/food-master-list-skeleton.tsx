import { Skeleton } from "@/components/ui/skeleton";

/** Loading skeleton for the food master list view */
const FoodMasterListSkeleton = () => (
  <div className="space-y-2.5 px-4 pt-4">
    <Skeleton className="h-10 w-full rounded-lg" />
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-[96px] rounded-xl" />
    ))}
  </div>
);

export { FoodMasterListSkeleton };
