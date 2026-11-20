import { Ban } from "lucide-react";
import type { ImportTokenSummary } from "@/components/features/health/types/health-import";
import {
  formatTokenDate,
  formatTokenDateTime,
} from "@/components/features/health/utils/format-health-import";
import { isImportTokenRevoked } from "@/components/features/health/utils/import-tokens";
import { Badge } from "@/components/ui/badge";
import { InlineDeleteConfirm } from "@/components/ui/inline-delete-confirm";
import { cn } from "@/utils";

type Props = {
  token: ImportTokenSummary;
  isConfirming: boolean;
  isRevoking: boolean;
  onOpenConfirm: () => void;
  onCancelConfirm: () => void;
  onConfirm: () => void;
};

export const ImportTokenRow = ({
  token,
  isConfirming,
  isRevoking,
  onOpenConfirm,
  onCancelConfirm,
  onConfirm,
}: Props) => {
  const isRevoked = isImportTokenRevoked(token);

  return (
    <li
      aria-label={token.label}
      className={cn(
        "rounded-lg border border-border/60 bg-background px-3 py-2",
        isRevoked && "opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium">{token.label}</p>
        <Badge variant={isRevoked ? "outline" : "secondary"}>
          {isRevoked ? "失効" : "有効"}
        </Badge>
      </div>
      <p className="mt-0.5 font-mono text-xs">{token.tokenPrefix}…</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        発行 {formatTokenDate(token.createdAt)}・最終使用{" "}
        {token.lastUsedAt ? formatTokenDateTime(token.lastUsedAt) : "未使用"}
      </p>
      {!isRevoked && (
        <InlineDeleteConfirm
          triggerLabel="失効"
          itemName={token.label}
          icon={Ban}
          question={`「${token.label}」を失効しますか？`}
          description="このトークンでの取り込みは、次の送信から受け付けなくなります。元に戻せません。"
          confirmLabel="失効する"
          pendingLabel="失効中..."
          isOpen={isConfirming}
          isDeleting={isRevoking}
          onOpen={onOpenConfirm}
          onCancel={onCancelConfirm}
          onConfirm={onConfirm}
        />
      )}
    </li>
  );
};
