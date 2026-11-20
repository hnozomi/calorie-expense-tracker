import { HeartPulse } from "lucide-react";
import type {
  HealthImportSourceStatus,
  ImportTokenSummary,
} from "@/components/features/health/types/health-import";
import { SectionHeader } from "@/components/ui/section-header";
import { HealthImportStatusList } from "./health-import-status-list";
import { ImportTokenList } from "./import-token-list";

type Props = {
  status: HealthImportSourceStatus[];
  tokens: ImportTokenSummary[];
};

export const HealthImportSection = ({ status, tokens }: Props) => (
  <section className="space-y-3" aria-label="健康データの取り込み">
    <SectionHeader icon={HeartPulse} label="健康データの取り込み" />
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/30 p-3.5">
      <p className="text-xs text-muted-foreground">
        Withings・Apple Health
        との接続はアプリでは行わず、もちがここで発行したトークンを使って毎朝データを送ります。
      </p>
      <HealthImportStatusList status={status} />
      <ImportTokenList tokens={tokens} />
    </div>
  </section>
);
