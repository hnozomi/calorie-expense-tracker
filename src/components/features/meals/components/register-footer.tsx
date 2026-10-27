import { Button } from "@/components/ui/button";

type Props = {
  draftCount: number;
  lastDraftName: string | null;
  totalCalories: number;
  isRegistering: boolean;
  onRegister: () => void;
};

// Stays visible under the scrolling panels, so the count and the register button are always in reach
export const RegisterFooter = ({
  draftCount,
  lastDraftName,
  totalCalories,
  isRegistering,
  onRegister,
}: Props) => (
  <div className="shrink-0 border-t bg-background px-4 pt-2.5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
    <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
      <span className="min-w-0 truncate">
        登録予定{" "}
        <span className="font-semibold text-foreground">{draftCount}</span> 件
        {lastDraftName && (
          <span className="ml-1">（直前: {lastDraftName}）</span>
        )}
      </span>
      <span className="shrink-0">
        合計{" "}
        <span className="font-semibold tabular-nums text-foreground">
          {Math.round(totalCalories)}
        </span>{" "}
        kcal
      </span>
    </div>
    <Button className="w-full" disabled={isRegistering} onClick={onRegister}>
      {isRegistering ? "登録中..." : `${draftCount}件まとめて登録する`}
    </Button>
  </div>
);
