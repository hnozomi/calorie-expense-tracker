import { Skeleton } from "@/components/ui/skeleton";

/** Loading skeleton for the daily meal view */
const DailySkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="mx-auto h-9 w-48 rounded-lg" />
    <Skeleton className="h-40 w-full rounded-xl" />
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-32 w-full rounded-xl" />
    ))}
  </div>
);

export { DailySkeleton };
