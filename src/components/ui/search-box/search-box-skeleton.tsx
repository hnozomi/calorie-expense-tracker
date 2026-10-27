import { Skeleton } from "@/components/ui/skeleton";

/** Holds the search field's place while the list section waits for ?q=, so the list does not shift down */
export const SearchBoxSkeleton = () => (
  <div className="px-4 pb-3 pt-3">
    <Skeleton className="h-10 w-full rounded-full" />
  </div>
);
