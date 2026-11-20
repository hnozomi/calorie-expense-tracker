import { describe, expect, it } from "vitest";
import type { ImportTokenSummary } from "@/components/features/health/types/health-import";
import {
  formatImportedAt,
  formatLatestDate,
  formatTokenDate,
  formatTokenDateTime,
} from "@/components/features/health/utils/format-health-import";
import {
  applyImportTokenRevoke,
  canIssueImportToken,
  isImportTokenRevoked,
} from "@/components/features/health/utils/import-tokens";

// The settings section for the health import (phase 1 design 3-2, task T-6)

const token = (
  id: string,
  revokedAt: string | null = null,
): ImportTokenSummary => ({
  id,
  label: `ラベル${id}`,
  tokenPrefix: "mlg_ABCD",
  createdAt: "2026-11-19T22:05:00Z",
  lastUsedAt: null,
  revokedAt,
});

describe("applyImportTokenRevoke", () => {
  it("T-6: 失効した1件だけに失効の時刻が入り、ほかは変わらない", () => {
    const tokens = [token("a"), token("b")];
    const shown = applyImportTokenRevoke(tokens, {
      id: "b",
      revokedAt: "2026-11-20T01:00:00Z",
    });
    expect(shown).toEqual([token("a"), token("b", "2026-11-20T01:00:00Z")]);
    expect(tokens[1]?.revokedAt).toBeNull();
  });

  it("T-6: すでに失効しているトークンは、失効した時刻を書き換えない", () => {
    const shown = applyImportTokenRevoke([token("a", "2026-11-18T00:00:00Z")], {
      id: "a",
      revokedAt: "2026-11-20T01:00:00Z",
    });
    expect(shown[0]?.revokedAt).toBe("2026-11-18T00:00:00Z");
  });

  it("T-6: 無い id なら一覧は変わらない", () => {
    const tokens = [token("a")];
    expect(
      applyImportTokenRevoke(tokens, {
        id: "x",
        revokedAt: "2026-11-20T01:00:00Z",
      }),
    ).toEqual(tokens);
  });
});

describe("canIssueImportToken", () => {
  it("T-6: 有効なトークンが4件までなら発行できる", () => {
    expect(canIssueImportToken([])).toBe(true);
    expect(
      canIssueImportToken(["1", "2", "3", "4"].map((id) => token(id))),
    ).toBe(true);
  });

  it("T-6: 有効なトークンが5件あると発行できない", () => {
    expect(
      canIssueImportToken(["1", "2", "3", "4", "5"].map((id) => token(id))),
    ).toBe(false);
  });

  it("T-6: 失効したトークンは5件に数えない", () => {
    const tokens = [
      ...["1", "2", "3", "4"].map((id) => token(id)),
      token("5", "2026-11-20T01:00:00Z"),
      token("6", "2026-11-20T01:00:00Z"),
    ];
    expect(canIssueImportToken(tokens)).toBe(true);
    expect(isImportTokenRevoked(tokens[4] as ImportTokenSummary)).toBe(true);
  });
});

describe("取り込み状態とトークンの日時の表示", () => {
  it("T-6: 最終取り込みは東京の時刻で M/D HH:mm", () => {
    expect(formatImportedAt("2026-11-18T22:05:00Z")).toBe("11/19 07:05");
    // Midnight in Tokyo is 00, not 24
    expect(formatImportedAt("2026-11-18T15:00:00Z")).toBe("11/19 00:00");
  });

  it("T-6: 最新のデータは日付だけを M/D", () => {
    expect(formatLatestDate("2026-11-09")).toBe("11/9");
  });

  it("T-6: トークンの発行日は年付きで、東京の日付", () => {
    expect(formatTokenDate("2026-12-31T15:30:00Z")).toBe("2027/1/1");
    expect(formatTokenDateTime("2026-11-19T22:05:00Z")).toBe(
      "2026/11/20 07:05",
    );
  });
});
