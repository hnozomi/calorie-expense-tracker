import { Skeleton } from "@/components/ui/skeleton";

/** Loading skeleton for recipe list */
export default function RecipesLoading() {
  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-brand-border bg-background/80 px-4 backdrop-blur-lg">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <main
        className="flex-1"
        style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="space-y-3 p-4">
          {/* Search bar skeleton */}
          <Skeleton className="h-9 w-full rounded-lg" />
          {/* Recipe cards skeleton */}
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </main>
    </>
  );
}
