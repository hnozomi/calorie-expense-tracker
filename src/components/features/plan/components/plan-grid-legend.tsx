export const PlanGridLegend = () => (
  <div className="flex items-center gap-3 px-4 pt-2 text-[10px] text-muted-foreground">
    <span className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full bg-destructive" />
      目標超過
    </span>
    <span className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full bg-amber-400" />
      目標の80%未満
    </span>
    <span className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full bg-brand" />
      目標範囲内
    </span>
  </div>
);
