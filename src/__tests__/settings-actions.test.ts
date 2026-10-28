import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteAllData,
  exportCsvRows,
  saveNutritionTarget,
} from "@/components/features/settings/api/actions";

type QueryResult = { data?: unknown; error: unknown };

/** A Supabase query builder: every call returns itself, and awaiting it gives the result */
const createQuery = (result: QueryResult = { data: [], error: null }) => {
  const query = {
    result,
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    is: vi.fn(() => query),
    gte: vi.fn(() => query),
    lte: vi.fn(() => query),
    order: vi.fn(() => query),
    upsert: vi.fn(() => query),
    delete: vi.fn(() => query),
    // biome-ignore lint/suspicious/noThenProperty: the Supabase builder is awaited directly
    then: (
      onFulfilled: (value: QueryResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(query.result).then(onFulfilled, onRejected),
  };
  return query;
};

let queries: Record<string, ReturnType<typeof createQuery>> = {};
const queryOf = (table: string) => {
  queries[table] ??= createQuery();
  return queries[table];
};
const from = vi.fn((table: string) => queryOf(table));
const getClaims = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from, auth: { getClaims } }),
}));

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

/** Every screen under the root layout is re-read once (AC-R-6) */
const expectScreensReRead = () => {
  expect(revalidatePath).toHaveBeenCalledTimes(1);
  expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
};

const validTarget = (overrides: Record<string, unknown> = {}) => ({
  targetCalories: 1800,
  targetProtein: 90,
  targetFat: 50,
  targetCarbs: 230,
  ...overrides,
});

beforeEach(() => {
  queries = {};
  getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("saveNutritionTarget (S-10 1日の目標)", () => {
  it("AC-R-6: 目標値をログイン中の利用者の行として保存し、成功したら全画面を読み直す(ホームの集計の目標が変わる)", async () => {
    const result = await saveNutritionTarget(validTarget());

    expect(result).toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith("user_settings");
    expect(queries.user_settings.upsert).toHaveBeenCalledWith(
      {
        user_id: "user-1",
        target_calories: 1800,
        target_protein: 90,
        target_fat: 50,
        target_carbs: 230,
      },
      { onConflict: "user_id" },
    );
    expectScreensReRead();
  });

  it.each([
    ["カロリーが 0", validTarget({ targetCalories: 0 })],
    ["カロリーが負", validTarget({ targetCalories: -100 })],
    ["カロリーが 10000 を超える", validTarget({ targetCalories: 10001 })],
    ["P が負", validTarget({ targetProtein: -1 })],
    ["F が 1000 を超える", validTarget({ targetFat: 1001 })],
    ["C が 2000 を超える", validTarget({ targetCarbs: 2001 })],
    ["数でない値", validTarget({ targetCalories: "1800" })],
    ["欄が足りない", { targetCalories: 1800 }],
    ["入力が無い", undefined],
  ])("ST-1: %sときは保存せず失敗を返す(サーバーでも確かめる)", async (_, input) => {
    const result = await saveNutritionTarget(input);

    expect(result).toEqual({ ok: false });
    expect(from).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("ST-1: 境界の値(カロリー 1・10000、PFC 0・上限)は保存する", async () => {
    expect(
      await saveNutritionTarget(
        validTarget({
          targetCalories: 1,
          targetProtein: 0,
          targetFat: 0,
          targetCarbs: 0,
        }),
      ),
    ).toEqual({ ok: true });
    expect(
      await saveNutritionTarget(
        validTarget({
          targetCalories: 10000,
          targetProtein: 1000,
          targetFat: 1000,
          targetCarbs: 2000,
        }),
      ),
    ).toEqual({ ok: true });
  });

  it("AC-R-5: ログインしていなければ保存せず失敗を返す", async () => {
    getClaims.mockResolvedValue({ data: null });

    const result = await saveNutritionTarget(validTarget());

    expect(result).toEqual({ ok: false });
    expect(queries.user_settings?.upsert).toBeUndefined();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("AC-R-5: 書き込みに失敗したら失敗を返し、画面を読み直さない", async () => {
    queryOf("user_settings").result = {
      data: null,
      error: { message: "denied" },
    };

    const result = await saveNutritionTarget(validTarget());

    expect(result).toEqual({ ok: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("deleteAllData (S-10 全データを削除)", () => {
  it("S-10: 食事記録・献立・セットメニュー・レシピ・食品マスタを、ログイン中の利用者の分だけ消し、全画面を読み直す", async () => {
    const result = await deleteAllData();

    expect(result).toEqual({ ok: true });
    for (const table of [
      "meals",
      "meal_plans",
      "set_menus",
      "recipes",
      "food_masters",
    ]) {
      expect(queries[table].delete).toHaveBeenCalledTimes(1);
      expect(queries[table].eq).toHaveBeenCalledWith("user_id", "user-1");
    }
    expectScreensReRead();
  });

  it("S-10: 目標値(user_settings)は消さない", async () => {
    await deleteAllData();

    expect(from).not.toHaveBeenCalledWith("user_settings");
  });

  it("AC-R-5: ログインしていなければ何も消さず失敗を返す", async () => {
    getClaims.mockResolvedValue({ data: null });

    const result = await deleteAllData();

    expect(result).toEqual({ ok: false });
    expect(from).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("AC-R-5: 途中で失敗したら失敗を返し、その後の表は消さない。消えた分があるので画面は読み直す", async () => {
    queryOf("set_menus").result = { data: null, error: { message: "boom" } };

    const result = await deleteAllData();

    expect(result).toEqual({ ok: false });
    expect(queries.recipes).toBeUndefined();
    expect(queries.food_masters).toBeUndefined();
    expectScreensReRead();
  });
});

describe("exportCsvRows (S-10 CSV エクスポート)", () => {
  it.each([
    ["recipes", "recipes"],
    ["food_masters", "food_masters"],
    ["set_menus", "set_menus"],
  ])("S-10: %s の行をサーバーで読んで返す(消したものは入れない)", async (type, table) => {
    queryOf(table).result = { data: [], error: null };

    const result = await exportCsvRows({ type, period: "all" });

    expect(result).toEqual({ ok: true, rows: [] });
    expect(from).toHaveBeenCalledWith(table);
    expect(queries[table].is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("S-10: 食事記録は日付と食事のタイミング付きの行にして返す", async () => {
    queryOf("meal_items").result = {
      data: [
        {
          name: "サラダチキン",
          calories: 110,
          protein: 24,
          fat: 1,
          carbs: 0,
          cost: 200,
          source_type: "manual",
          meals: { date: "2026-10-20", meal_type: "lunch" },
        },
      ],
      error: null,
    };

    const result = await exportCsvRows({ type: "meals", period: "all" });

    expect(result).toEqual({
      ok: true,
      rows: [
        {
          date: "2026-10-20",
          meal_type: "lunch",
          name: "サラダチキン",
          calories: 110,
          protein: 24,
          fat: 1,
          carbs: 0,
          cost: 200,
          source_type: "manual",
        },
      ],
    });
    expect(queries.meal_items.gte).not.toHaveBeenCalled();
  });

  it("S-10: セットメニューはアイテムの数を数えて返す", async () => {
    queryOf("set_menus").result = {
      data: [
        {
          name: "朝定食",
          total_calories: 650,
          total_protein: 30,
          total_fat: 15,
          total_carbs: 80,
          total_cost: 450,
          set_menu_items: [{ id: "a" }, { id: "b" }],
        },
      ],
      error: null,
    };

    const result = await exportCsvRows({ type: "set_menus", period: "all" });

    expect(result).toEqual({
      ok: true,
      rows: [
        {
          name: "朝定食",
          total_calories: 650,
          total_protein: 30,
          total_fat: 15,
          total_carbs: 80,
          total_cost: 450,
          item_count: 2,
        },
      ],
    });
  });

  describe("食事記録の期間は Asia/Tokyo の月で決める(サーバーは UTC で動く)", () => {
    const originalTz = process.env.TZ;

    beforeEach(() => {
      process.env.TZ = "UTC";
      vi.useFakeTimers({ toFake: ["Date"] });
    });

    afterEach(() => {
      process.env.TZ = originalTz;
    });

    it("S-10: UTC ではまだ 10/31 でも東京で 11/1 なら、今月は 11 月", async () => {
      vi.setSystemTime(new Date("2026-10-31T16:00:00Z"));

      await exportCsvRows({ type: "meals", period: "this_month" });

      expect(queries.meal_items.gte).toHaveBeenCalledWith(
        "meals.date",
        "2026-11-01",
      );
      expect(queries.meal_items.lte).toHaveBeenCalledWith(
        "meals.date",
        "2026-11-30",
      );
    });

    it("S-10: 同じ時刻の先月は 10 月(1日から31日まで)", async () => {
      vi.setSystemTime(new Date("2026-10-31T16:00:00Z"));

      await exportCsvRows({ type: "meals", period: "last_month" });

      expect(queries.meal_items.gte).toHaveBeenCalledWith(
        "meals.date",
        "2026-10-01",
      );
      expect(queries.meal_items.lte).toHaveBeenCalledWith(
        "meals.date",
        "2026-10-31",
      );
    });

    it("S-10: 1月の先月は前の年の12月", async () => {
      vi.setSystemTime(new Date("2027-01-10T03:00:00Z"));

      await exportCsvRows({ type: "meals", period: "last_month" });

      expect(queries.meal_items.gte).toHaveBeenCalledWith(
        "meals.date",
        "2026-12-01",
      );
      expect(queries.meal_items.lte).toHaveBeenCalledWith(
        "meals.date",
        "2026-12-31",
      );
    });
  });

  it.each([
    ["知らない種類", { type: "users", period: "all" }],
    ["知らない期間", { type: "meals", period: "last_year" }],
    ["入力が無い", undefined],
  ])("S-10: %sは読まずに失敗を返す", async (_, input) => {
    const result = await exportCsvRows(input);

    expect(result).toEqual({ ok: false });
    expect(from).not.toHaveBeenCalled();
  });

  it("S-10: 読めなかったときは失敗を返す(例外にしない)", async () => {
    queryOf("recipes").result = { data: null, error: { message: "boom" } };

    const result = await exportCsvRows({ type: "recipes", period: "all" });

    expect(result).toEqual({ ok: false });
  });

  it("S-10: 書き込みではないので、画面を読み直さない", async () => {
    await exportCsvRows({ type: "recipes", period: "all" });

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
