import { Skeleton } from "@/components/ui/skeleton";

/** Loading skeleton for meal plan calendar */
export default function PlanLoading() {
  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-brand-border bg-background/80 px-4 backdrop-blur-lg">
        <Skeleton className="h-5 w-16" />
      </div>
      <main
        className="flex-1"
        style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="space-y-4 p-4">
          {/* Week navigation skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          {/* Calendar grid skeleton */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
