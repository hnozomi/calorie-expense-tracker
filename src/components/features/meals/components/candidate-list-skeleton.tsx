import { Skeleton } from "@/components/ui/skeleton";

export const CandidateListSkeleton = () => (
  <div className="space-y-1">
    {["c1", "c2", "c3"].map((key) => (
      <Skeleton key={key} className="h-14 rounded-lg" />
    ))}
  </div>
);
