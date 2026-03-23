import { Skeleton } from "@/components/ui/skeleton";

/** Loading skeleton for the plan calendar view */
const PlanSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="mx-auto h-8 w-40 rounded-full" />
    <Skeleton className="h-64 w-full rounded-xl" />
    <Skeleton className="h-32 w-full rounded-xl" />
  </div>
);

export { PlanSkeleton };
