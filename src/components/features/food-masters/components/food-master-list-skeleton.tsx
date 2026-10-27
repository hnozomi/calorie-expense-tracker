import { Skeleton } from "@/components/ui/skeleton";

/** Loading skeleton for the food master list view */
export const FoodMasterListSkeleton = () => (
  <div className="space-y-2.5 px-4 pt-4">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-[96px] rounded-xl" />
    ))}
  </div>
);
