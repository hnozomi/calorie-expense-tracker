import { Skeleton } from "@/components/ui/skeleton";

/** Loading skeleton for the weekly report view */
const ReportSkeleton = () => (
  <div className="space-y-4 px-4 pt-4">
    <Skeleton className="mx-auto h-8 w-40 rounded-full" />
    <Skeleton className="h-52 w-full rounded-xl" />
    <Skeleton className="h-52 w-full rounded-xl" />
    <Skeleton className="h-52 w-full rounded-xl" />
  </div>
);

export { ReportSkeleton };
