import type { HealthImportSourceStatus } from "@/components/features/health/types/health-import";
import {
  formatImportedAt,
  formatLatestDate,
  HEALTH_SOURCE_LABELS,
} from "@/components/features/health/utils/format-health-import";

type Props = {
  status: HealthImportSourceStatus[];
};

export const HealthImportStatusList = ({ status }: Props) => {
  const hasAnyImport = status.some((source) => source.lastImportedAt !== null);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium">取り込み状態</h3>
      {hasAnyImport ? (
        <ul className="space-y-2" aria-label="取り込み状態">
          {status.map(({ source, lastImportedAt, latestDate }) => {
            const { name, metrics } = HEALTH_SOURCE_LABELS[source];
            return (
              <li
                key={source}
                aria-label={name}
                className="rounded-lg border border-border/60 bg-background px-3 py-2"
              >
                <p className="text-sm font-medium">
                  {name}
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    {metrics}
                  </span>
                </p>
                {lastImportedAt ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    最終取り込み {formatImportedAt(lastImportedAt)}
                    ・最新のデータ{" "}
                    {latestDate ? formatLatestDate(latestDate) : "—"}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    まだ取り込みはありません
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          まだ取り込みはありません
        </p>
      )}
    </div>
  );
};
