import { Skeleton } from "@/components/ui/skeleton";

/** Loading skeleton for the recipe list view */
const RecipeListSkeleton = () => (
  <div className="space-y-2.5 px-4 pt-4">
    <Skeleton className="h-10 w-full rounded-lg" />
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-[96px] rounded-xl" />
    ))}
  </div>
);

export { RecipeListSkeleton };
