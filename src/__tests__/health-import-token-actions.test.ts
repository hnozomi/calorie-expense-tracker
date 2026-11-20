import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  issueImportToken,
  revokeImportToken,
} from "@/components/features/health/api/actions";

type QueryResult = { data?: unknown; error: unknown };

/** A Supabase query builder: every call returns itself, and awaiting it gives the result */
const createQuery = (result: QueryResult = { data: null, error: null }) => {
  const query = {
    result,
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    eq: vi.fn(() => query),
    is: vi.fn(() => query),
    select: vi.fn(() => query),
    // biome-ignore lint/suspicious/noThenProperty: the Supabase builder is awaited directly
    then: (
      onFulfilled: (value: QueryResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(query.result).then(onFulfilled, onRejected),
  };
  return query;
};

let query = createQuery();
const from = vi.fn(() => query);
const getClaims = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from, auth: { getClaims } }),
}));

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

const TOKEN_ID = "00000000-0000-4000-8000-0000000000f1";

const sha256Hex = (value: string) =>
  createHash("sha256").update(value, "utf8").digest("hex");

/** The row the action sent to import_tokens */
const insertedRow = () => {
  const [row] = query.insert.mock.calls[0] as unknown as [
    Record<string, unknown>,
  ];
  return row;
};

/** The token the action returned (fails the test when it did not return one) */
const issuedToken = (result: Awaited<ReturnType<typeof issueImportToken>>) => {
  if (!result.ok) throw new Error("expected a token");
  return result.token;
};

beforeEach(() => {
  query = createQuery();
  getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("issueImportToken (取り込みトークンの発行)", () => {
  it("mlg_ で始まる 256 ビットの乱数のトークンを1回だけ返し、ログイン中の利用者の行として保存して全画面を読み直す", async () => {
    const result = await issueImportToken({ label: "もち" });

    const token = issuedToken(result);
    // mlg_ + base64url of 32 bytes (43 characters without padding)
    expect(token).toMatch(/^mlg_[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(token.slice(4), "base64url")).toHaveLength(32);
    expect(Object.keys(result).sort()).toEqual(["ok", "token"]);
    expect(from).toHaveBeenCalledWith("import_tokens");
    expect(query.insert).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("平文は保存せず、SHA-256 の16進と先頭8文字だけを保存する", async () => {
    const token = issuedToken(await issueImportToken({ label: "もち" }));

    expect(insertedRow()).toEqual({
      user_id: "user-1",
      label: "もち",
      token_hash: sha256Hex(token),
      token_prefix: token.slice(0, 8),
    });
    expect(insertedRow().token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(insertedRow())).not.toContain(token);
  });

  it("発行のたびに違うトークンになる", async () => {
    const first = issuedToken(await issueImportToken({ label: "もち" }));
    const second = issuedToken(await issueImportToken({ label: "もち" }));

    expect(first).not.toBe(second);
  });

  it("トークンをログに出さない", async () => {
    const logs = [
      vi.spyOn(console, "log"),
      vi.spyOn(console, "info"),
      vi.spyOn(console, "warn"),
      vi.spyOn(console, "error"),
      vi.spyOn(console, "debug"),
    ];

    await issueImportToken({ label: "もち" });
    query = createQuery({ data: null, error: { code: "P0001" } });
    await issueImportToken({ label: "もち" });

    for (const log of logs) expect(log).not.toHaveBeenCalled();
  });

  it("ラベルの前後の空白を除いて保存する", async () => {
    await issueImportToken({ label: "  もち  " });

    expect(insertedRow().label).toBe("もち");
  });

  it("ラベルは40文字まで保存する", async () => {
    const result = await issueImportToken({ label: "あ".repeat(40) });

    expect(result.ok).toBe(true);
    expect(insertedRow().label).toBe("あ".repeat(40));
  });

  it.each([
    ["ラベルが空", { label: "" }],
    ["ラベルが空白だけ", { label: "   " }],
    ["ラベルが40文字を超える", { label: "あ".repeat(41) }],
    ["ラベルが文字列でない", { label: 1 }],
    ["ラベルが無い", {}],
    ["入力が無い", undefined],
  ])("%sときは発行せず失敗を返す", async (_, input) => {
    const result = await issueImportToken(input);

    expect(result).toEqual({ ok: false });
    expect(from).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("ログインしていなければ発行せず失敗を返す", async () => {
    getClaims.mockResolvedValue({ data: null });

    const result = await issueImportToken({ label: "もち" });

    expect(result).toEqual({ ok: false });
    expect(query.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("有効なトークンがすでに5件あって DB が断ったときは、トークンを返さず失敗を返す", async () => {
    query = createQuery({
      data: null,
      error: { code: "P0001", message: "import token limit reached" },
    });

    const result = await issueImportToken({ label: "6件目" });

    expect(result).toEqual({ ok: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("revokeImportToken (取り込みトークンの失効)", () => {
  it("まだ失効していない自分のトークンの revoked_at に今の時刻を入れ、全画面を読み直す", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-20T01:00:00.000Z"));
    query = createQuery({ data: [{ id: TOKEN_ID }], error: null });

    const result = await revokeImportToken(TOKEN_ID);

    expect(result).toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith("import_tokens");
    expect(query.update).toHaveBeenCalledWith({
      revoked_at: "2026-11-20T01:00:00.000Z",
    });
    expect(query.eq).toHaveBeenCalledWith("id", TOKEN_ID);
    expect(query.is).toHaveBeenCalledWith("revoked_at", null);
    expect(revalidatePath).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("該当するトークンが無い(他人のもの・失効済み)ときは失敗を返す", async () => {
    query = createQuery({ data: [], error: null });

    const result = await revokeImportToken(TOKEN_ID);

    expect(result).toEqual({ ok: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("DB のエラーのときは失敗を返す", async () => {
    query = createQuery({ data: null, error: { code: "42501" } });

    const result = await revokeImportToken(TOKEN_ID);

    expect(result).toEqual({ ok: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it.each([
    ["uuid でない", "not-a-uuid"],
    ["文字列でない", 1],
    ["無い", undefined],
  ])("id が%sときは失効させず失敗を返す", async (_, id) => {
    const result = await revokeImportToken(id);

    expect(result).toEqual({ ok: false });
    expect(from).not.toHaveBeenCalled();
  });

  it("ログインしていなければ失効させず失敗を返す", async () => {
    getClaims.mockResolvedValue({ data: null });

    const result = await revokeImportToken(TOKEN_ID);

    expect(result).toEqual({ ok: false });
    expect(query.update).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
