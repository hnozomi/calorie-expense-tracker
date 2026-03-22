import { Skeleton } from "@/components/ui/skeleton";

/** Loading skeleton for home daily view */
export default function HomeLoading() {
  return (
    <>
      {/* Header skeleton */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-brand-border bg-background/80 px-4 backdrop-blur-lg">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <main
        className="flex-1"
        style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="space-y-4 p-4">
          {/* Date selector skeleton */}
          <Skeleton className="mx-auto h-9 w-48 rounded-lg" />
          {/* Summary card skeleton */}
          <Skeleton className="h-24 w-full rounded-xl" />
          {/* Meal cards skeleton */}
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </main>
    </>
  );
}
