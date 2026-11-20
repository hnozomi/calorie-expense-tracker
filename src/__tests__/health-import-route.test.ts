import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as routeModule from "@/app/api/import/health-daily/route";

const { POST } = routeModule;

const rpc = vi.fn();
vi.mock("@/lib/supabase/sessionless", () => ({
  createSessionlessClient: () => ({ rpc }),
}));

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

const TOKEN = "mlg_NOHLCYvecpx2UIK8JierM9_Ar7aDXuUqowQeuoYAYEg";
const URL_OF_ROUTE = "http://localhost/api/import/health-daily";

// 2026-11-20 10:00 in Japan
const NOW = new Date("2026-11-20T01:00:00Z");

const weightRecord = {
  date: "2026-11-19",
  source: "withings",
  metrics: { weight_kg: 82.4, body_fat_pct: 21.3 },
  measured_at: "2026-11-19T07:02:00+09:00",
};

const stepsRecord = {
  date: "2026-11-18",
  source: "apple_health",
  metrics: { steps: 8214, active_energy_kcal: 412 },
};

const postImport = (
  body: unknown,
  {
    authorization = `Bearer ${TOKEN}`,
    url = URL_OF_ROUTE,
  }: { authorization?: string | null; url?: string } = {},
) => {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (authorization !== null) headers.set("Authorization", authorization);
  return POST(
    new Request(url, {
      method: "POST",
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
};

/** Status and parsed body of a response */
const read = async (response: Response) => ({
  status: response.status,
  body: (await response.json()) as Record<string, unknown>,
});

/** The issue paths of a 400 response */
const issuePaths = (body: Record<string, unknown>) =>
  (body.issues as { path: string }[]).map((issue) => issue.path);

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  rpc.mockResolvedValue({
    data: { ok: true, received: 4, changed: 3 },
    error: null,
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("POST /api/import/health-daily (成功)", () => {
  it("200 で { ok, received, changed } を返し、トークンと送られたレコードをそのまま関数に渡して全画面を読み直す", async () => {
    const { status, body } = await read(
      await postImport({ records: [weightRecord, stepsRecord] }),
    );

    expect(status).toBe(200);
    expect(body).toEqual({ ok: true, received: 4, changed: 3 });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("import_health_daily", {
      p_token: TOKEN,
      p_records: [weightRecord, stepsRecord],
    });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("measured_at は加工せずそのまま渡す（秒なし・Z・小数秒）", async () => {
    const records = [
      { ...weightRecord, measured_at: "2026-11-19T07:02+09:00" },
      {
        ...weightRecord,
        source: "apple_health",
        measured_at: "2026-11-18T22:02:00.123Z",
      },
    ];
    await postImport({ records });

    expect(rpc.mock.calls[0][1].p_records).toEqual(records);
  });

  it("measured_at が無い・null のレコードも受け付ける", async () => {
    const records = [stepsRecord, { ...weightRecord, measured_at: null }];
    const { status } = await read(await postImport({ records }));

    expect(status).toBe(200);
    expect(rpc.mock.calls[0][1].p_records).toEqual(records);
  });

  it("日本時間の今日の日付は受け付ける（UTC ではまだ前日でも）", async () => {
    // 2026-11-20 08:00 in Japan is 2026-11-19 in UTC
    vi.setSystemTime(new Date("2026-11-19T23:00:00Z"));
    const { status } = await read(
      await postImport({ records: [{ ...weightRecord, date: "2026-11-20" }] }),
    );

    expect(status).toBe(200);
  });

  it("100件までは受け付ける", async () => {
    const records = Array.from({ length: 100 }, (_, index) => ({
      date: `2026-${String(Math.floor(index / 28) + 1).padStart(2, "0")}-${String((index % 28) + 1).padStart(2, "0")}`,
      source: "apple_health",
      metrics: { steps: index },
    }));
    const { status } = await read(await postImport({ records }));

    expect(status).toBe(200);
    expect(rpc.mock.calls[0][1].p_records).toHaveLength(100);
  });

  it("同じ内容の再送で関数が changed: 0 を返せば、そのまま返す", async () => {
    rpc.mockResolvedValue({
      data: { ok: true, received: 2, changed: 0 },
      error: null,
    });
    const { status, body } = await read(
      await postImport({ records: [weightRecord] }),
    );

    expect(status).toBe(200);
    expect(body).toEqual({ ok: true, received: 2, changed: 0 });
  });
});

describe("POST /api/import/health-daily (401 unauthorized)", () => {
  it.each([
    ["Authorization が無い", null],
    ["Bearer でない", `Basic ${TOKEN}`],
    ["Bearer の後が空", "Bearer "],
    ["トークンが2つある", `Bearer ${TOKEN} ${TOKEN}`],
  ])("%s ときは関数を呼ばずに 401 を返す", async (_, authorization) => {
    const { status, body } = await read(
      await postImport({ records: [weightRecord] }, { authorization }),
    );

    expect(status).toBe(401);
    expect(body).toEqual({ ok: false, error: "unauthorized" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("クエリ文字列のトークンは受け付けない（ヘッダーが無ければ 401）", async () => {
    const { status, body } = await read(
      await postImport(
        { records: [weightRecord] },
        {
          authorization: null,
          url: `${URL_OF_ROUTE}?token=${TOKEN}&access_token=${TOKEN}`,
        },
      ),
    );

    expect(status).toBe(401);
    expect(body).toEqual({ ok: false, error: "unauthorized" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("関数がトークンを断ったら（不明・失効・スコープ不足）401 を返し、画面を読み直さない", async () => {
    rpc.mockResolvedValue({
      data: { ok: false, error: "unauthorized" },
      error: null,
    });
    const { status, body } = await read(
      await postImport({ records: [weightRecord] }),
    );

    expect(status).toBe(401);
    expect(body).toEqual({ ok: false, error: "unauthorized" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("POST /api/import/health-daily (413 too_large)", () => {
  it("101件は関数を呼ばずに 413 を返す", async () => {
    const records = Array.from({ length: 101 }, () => stepsRecord);
    const { status, body } = await read(await postImport({ records }));

    expect(status).toBe(413);
    expect(body).toEqual({ ok: false, error: "too_large" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("本文が 64KB を超えたら関数を呼ばずに 413 を返す", async () => {
    const body = JSON.stringify({
      records: [weightRecord],
      padding: "x".repeat(64 * 1024),
    });
    const response = await read(await postImport(body));

    expect(response.status).toBe(413);
    expect(response.body).toEqual({ ok: false, error: "too_large" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("本文がちょうど 64KB なら大きさでは断らない", async () => {
    const base = JSON.stringify({ records: [weightRecord], padding: "" });
    const body = JSON.stringify({
      records: [weightRecord],
      padding: "x".repeat(64 * 1024 - base.length),
    });
    expect(new TextEncoder().encode(body).byteLength).toBe(64 * 1024);

    const { status } = await read(await postImport(body));

    expect(status).toBe(200);
  });
});

describe("POST /api/import/health-daily (400 invalid_body)", () => {
  /** Post records and expect a 400 whose issues include the path, without calling the function */
  const expectInvalid = async (body: unknown, path: string) => {
    const response = await read(await postImport(body));

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.error).toBe("invalid_body");
    expect(issuePaths(response.body)).toContain(path);
    expect(rpc).not.toHaveBeenCalled();
  };

  it("JSON でない本文は 400", async () => {
    await expectInvalid("{records:", "");
  });

  it("records が無い・配列でないときは 400", async () => {
    await expectInvalid({}, "records");
    rpc.mockClear();
    await expectInvalid({ records: weightRecord }, "records");
  });

  it("records が0件なら 400", async () => {
    await expectInvalid({ records: [] }, "records");
  });

  it("未来の日付（日本時間の今日より後）は 400", async () => {
    await expectInvalid(
      { records: [{ ...weightRecord, date: "2026-11-21" }] },
      "records.0.date",
    );
  });

  it.each([
    ["形が違う", "2026/11/19"],
    ["存在しない日", "2026-02-30"],
  ])("日付が%sときは 400", async (_, date) => {
    await expectInvalid(
      { records: [{ ...weightRecord, date }] },
      "records.0.date",
    );
  });

  it("未知の metrics のキーは 400（黙って捨てない）", async () => {
    await expectInvalid(
      {
        records: [
          { ...weightRecord, metrics: { weight_kg: 82.4, sleep_hours: 7 } },
        ],
      },
      "records.0.metrics",
    );
  });

  it("metrics が空なら 400", async () => {
    await expectInvalid(
      { records: [{ ...weightRecord, metrics: {} }] },
      "records.0.metrics",
    );
  });

  it("レコードの知らないキー（user_id など）は 400", async () => {
    await expectInvalid(
      { records: [{ ...weightRecord, user_id: "someone" }] },
      "records.0",
    );
  });

  it("manual などの出所は 400", async () => {
    await expectInvalid(
      { records: [{ ...weightRecord, source: "manual" }] },
      "records.0.source",
    );
  });

  it.each([
    ["タイムゾーンが無い", "2026-11-19T07:02:00"],
    ["日付だけ", "2026-11-19"],
    ["言葉", "now"],
    ["存在しない時刻", "2026-11-19T25:00:00+09:00"],
  ])("measured_at が%sときは 400", async (_, measuredAt) => {
    await expectInvalid(
      { records: [{ ...weightRecord, measured_at: measuredAt }] },
      "records.0.measured_at",
    );
  });

  it.each([
    ["体重が範囲外", { weight_kg: 19.99 }, "weight_kg"],
    ["体重が小数第3位まで", { weight_kg: 82.123 }, "weight_kg"],
    ["体脂肪率が範囲外", { body_fat_pct: 75.1 }, "body_fat_pct"],
    ["体脂肪率が小数第2位まで", { body_fat_pct: 21.25 }, "body_fat_pct"],
    ["歩数が小数", { steps: 8214.5 }, "steps"],
    ["歩数が負", { steps: -1 }, "steps"],
    ["活動量が範囲外", { active_energy_kcal: 10000.5 }, "active_energy_kcal"],
    ["値が文字列", { weight_kg: "82.4" }, "weight_kg"],
  ])("%sなら 400", async (_, metrics, metric) => {
    await expectInvalid(
      { records: [{ ...weightRecord, metrics }] },
      `records.0.metrics.${metric}`,
    );
  });

  it("同じ date＋source＋項目がリクエストの中で重複したら 400", async () => {
    await expectInvalid(
      {
        records: [
          weightRecord,
          { ...weightRecord, metrics: { weight_kg: 82.5 } },
        ],
      },
      "records.1.metrics.weight_kg",
    );
  });

  it("同じ日・項目でも出所が違えば重複ではない", async () => {
    const { status } = await read(
      await postImport({
        records: [
          weightRecord,
          { ...weightRecord, source: "apple_health", measured_at: null },
        ],
      }),
    );

    expect(status).toBe(200);
  });

  it("関数が invalid_records を返したら 400 invalid_body にし、画面を読み直さない", async () => {
    rpc.mockResolvedValue({
      data: { ok: false, error: "invalid_records" },
      error: null,
    });
    const { status, body } = await read(
      await postImport({ records: [weightRecord] }),
    );

    expect(status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "invalid_body",
      issues: [{ path: "records", message: "Refused by the import function" }],
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("POST /api/import/health-daily (500 internal)", () => {
  it.each([
    [
      "関数の呼び出しがエラーを返した",
      () =>
        rpc.mockResolvedValue({
          data: null,
          error: { code: "PGRST202", message: "boom", details: TOKEN },
        }),
    ],
    [
      "関数が知らない形を返した",
      () => rpc.mockResolvedValue({ data: { ok: "yes" }, error: null }),
    ],
    [
      "関数の呼び出しが例外を投げた",
      () => rpc.mockRejectedValue(new TypeError("fetch failed")),
    ],
  ])("%sら 500 を返し、画面を読み直さない", async (_, arrange) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    arrange();
    const { status, body } = await read(
      await postImport({ records: [weightRecord] }),
    );

    expect(status).toBe(500);
    expect(body).toEqual({ ok: false, error: "internal" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("POST /api/import/health-daily (ログ)", () => {
  it("どの結果でも、トークン・本文の値・Supabase のエラーの中身をログに出さない", async () => {
    const methods = ["log", "info", "warn", "error", "debug"] as const;
    const spies = methods.map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {}),
    );
    const results = [
      { data: { ok: true, received: 2, changed: 2 }, error: null },
      { data: { ok: false, error: "unauthorized" }, error: null },
      { data: { ok: false, error: "invalid_records" }, error: null },
      {
        data: null,
        error: {
          code: "P0001",
          message: `failed for ${TOKEN}`,
          details: JSON.stringify(weightRecord),
        },
      },
      { data: { unexpected: TOKEN }, error: null },
    ];
    for (const result of results) {
      rpc.mockResolvedValueOnce(result);
      await postImport({ records: [weightRecord] });
    }
    rpc.mockRejectedValueOnce(new Error(`network error for ${TOKEN}`));
    await postImport({ records: [weightRecord] });
    await postImport({ records: [{ ...weightRecord, date: "bad" }] });
    await postImport("not json");

    const logged = JSON.stringify(spies.flatMap((spy) => spy.mock.calls));
    expect(logged).not.toContain(TOKEN);
    expect(logged).not.toContain("mlg_");
    expect(logged).not.toContain("82.4");
    expect(logged).not.toContain("withings");
    expect(logged).not.toContain("failed for");
    expect(logged).not.toContain("network error");
    // The failures do leave a trace of their kind
    expect(logged).toContain("P0001");
  });
});

describe("/api/import/health-daily (メソッド)", () => {
  it("POST だけを export する（ほかのメソッドは Next.js が 405 を返す）", () => {
    expect(Object.keys(routeModule)).toEqual(["POST"]);
  });
});
