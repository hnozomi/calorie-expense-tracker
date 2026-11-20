import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryResult = { data: unknown; error: unknown };

// Each from() call gets a builder of its own; awaiting it (or maybeSingle) gives the result picked for its filters
const calls: { table: string; select: string; filters: unknown[][] }[] = [];
let resultFor: (call: (typeof calls)[number]) => QueryResult = () => ({
  data: null,
  error: null,
});

const from = vi.fn((table: string) => {
  const call = { table, select: "", filters: [] as unknown[][] };
  calls.push(call);
  const query = {
    select: (columns: string) => {
      call.select = columns;
      return query;
    },
    eq: (...args: unknown[]) => {
      call.filters.push(["eq", ...args]);
      return query;
    },
    order: (...args: unknown[]) => {
      call.filters.push(["order", ...args]);
      return query;
    },
    limit: () => query,
    maybeSingle: async () => resultFor(call),
    // biome-ignore lint/suspicious/noThenProperty: the Supabase builder is awaited directly
    then: (
      onFulfilled: (value: QueryResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resultFor(call)).then(onFulfilled, onRejected),
  };
  return query;
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from }),
}));
vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));

const { getHealthImportStatus, getImportTokens } = await import(
  "@/components/features/health/api/queries"
);

beforeEach(() => {
  calls.length = 0;
  from.mockClear();
});

describe("getImportTokens", () => {
  it("T-6: token_hash を select せず、画面に要る列だけを読む", async () => {
    resultFor = () => ({
      data: [
        {
          id: "t1",
          label: "もち",
          token_prefix: "mlg_ABCD",
          created_at: "2026-11-19T22:05:00Z",
          last_used_at: null,
          revoked_at: null,
        },
      ],
      error: null,
    });

    const tokens = await getImportTokens();

    expect(calls).toHaveLength(1);
    expect(calls[0]?.table).toBe("import_tokens");
    expect(calls[0]?.select).not.toContain("token_hash");
    expect(tokens).toEqual([
      {
        id: "t1",
        label: "もち",
        tokenPrefix: "mlg_ABCD",
        createdAt: "2026-11-19T22:05:00Z",
        lastUsedAt: null,
        revokedAt: null,
      },
    ]);
  });

  it("T-6: 読めなかったら例外にする（空の一覧に見せない）", async () => {
    resultFor = () => ({ data: null, error: { code: "42501" } });
    await expect(getImportTokens()).rejects.toEqual({ code: "42501" });
  });
});

describe("getHealthImportStatus", () => {
  it("T-6: 出所ごとに imported_at の最大を最終取り込み、date の最大を最新のデータにする", async () => {
    resultFor = (call) => {
      const source = call.filters.find((filter) => filter[0] === "eq")?.[2];
      if (source !== "withings") return { data: null, error: null };
      return call.select === "imported_at"
        ? { data: { imported_at: "2026-11-18T22:05:00Z" }, error: null }
        : { data: { date: "2026-11-19" }, error: null };
    };

    const status = await getHealthImportStatus();

    expect(status).toEqual([
      {
        source: "withings",
        lastImportedAt: "2026-11-18T22:05:00Z",
        latestDate: "2026-11-19",
      },
      { source: "apple_health", lastImportedAt: null, latestDate: null },
    ]);
    // Each read orders by the column it takes the newest of
    for (const call of calls) {
      expect(call.filters).toContainEqual([
        "order",
        call.select,
        { ascending: false },
      ]);
    }
    expect(calls.every((call) => call.table === "health_daily_values")).toBe(
      true,
    );
  });
});
