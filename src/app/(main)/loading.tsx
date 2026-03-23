import { Skeleton } from "@/components/ui/skeleton";

export default function MainLoading() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="mx-auto h-8 w-40 rounded-full" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}
