import { Skeleton } from "@/components/ui/skeleton";

/** Loading skeleton for the recipe form view */
const RecipeFormSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-10 w-full rounded-lg" />
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

export { RecipeFormSkeleton };
