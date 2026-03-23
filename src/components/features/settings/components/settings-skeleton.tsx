import { Skeleton } from "@/components/ui/skeleton";

/** Loading skeleton for the settings view */
const SettingsSkeleton = () => (
  <div className="space-y-6 p-4">
    <Skeleton className="h-40 w-full rounded-xl" />
    <Skeleton className="h-20 w-full rounded-xl" />
  </div>
);

export { SettingsSkeleton };
