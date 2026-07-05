import { Skeleton } from "@/components/ui/skeleton";

export default function MainLoading() {
  return (
    <>
      {/* Mirror the sticky Header height so the layout doesn't jump when the page loads */}
      <div className="sticky top-0 z-40 flex h-14 items-center border-b border-border/40 bg-background/95 px-4">
        <Skeleton className="h-5 w-28 rounded-md" />
      </div>
      <div className="space-y-4 p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="mx-auto h-8 w-40 rounded-full" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </>
  );
}
