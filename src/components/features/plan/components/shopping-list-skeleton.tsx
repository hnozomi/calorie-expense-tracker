import { Skeleton } from "@/components/ui/skeleton";

export const ShoppingListSkeleton = () => (
  <div className="space-y-2">
    {["sl1", "sl2", "sl3"].map((key) => (
      <Skeleton key={key} className="h-10 rounded-lg" />
    ))}
  </div>
);
