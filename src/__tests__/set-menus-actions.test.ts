import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteSetMenu,
  saveSetMenu,
} from "@/components/features/set-menus/api/actions";

type QueryResult = { data?: unknown; error: unknown };

/** A Supabase query builder: every call returns itself, and awaiting it gives the result */
const createQuery = (
  result: QueryResult = { data: [{ id: "x" }], error: null },
) => {
  const query = {
    result,
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    is: vi.fn(() => query),
    update: vi.fn(() => query),
    // biome-ignore lint/suspicious/noThenProperty: the Supabase builder is awaited directly
    then: (
      onFulfilled: (value: QueryResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(query.result).then(onFulfilled, onRejected),
  };
  return query;
};

let setMenus = createQuery();
const from = vi.fn((_table: string) => setMenus);
let rpcResult: QueryResult = { data: "new-id", error: null };
const rpc = vi.fn(async (_name: string, _args: unknown) => rpcResult);

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from, rpc }),
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

const expectNothingWritten = () => {
  expect(from).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
  expect(revalidatePath).not.toHaveBeenCalled();
};

const SET_MENU_ID = "5c6d7e8f-9a0b-4c1d-8e2f-3a4b5c6d7e8f";
const RECIPE_ID = "7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d";
const MASTER_ID = "3f1c2b4a-5d6e-4f70-8a9b-0c1d2e3f4a5b";

const recipeItem = (overrides: Record<string, unknown> = {}) => ({
  name: "肉じゃが",
  recipeId: RECIPE_ID,
  foodMasterId: null,
  calories: 400,
  protein: 15,
  fat: 10,
  carbs: 50,
  cost: 200,
  servingQuantity: 1,
  ...overrides,
});

const masterItem = (overrides: Record<string, unknown> = {}) => ({
  name: "ご飯",
  recipeId: null,
  foodMasterId: MASTER_ID,
  calories: 250,
  protein: 4,
  fat: 0.5,
  carbs: 55,
  cost: 50,
  servingQuantity: 1.5,
  ...overrides,
});

const validSave = (overrides: Record<string, unknown> = {}) => ({
  values: { name: "定食セット" },
  items: [recipeItem(), masterItem()],
  ...overrides,
});

beforeEach(() => {
  setMenus = createQuery();
  rpcResult = { data: "new-id", error: null };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("saveSetMenu (S-06a セットメニューの保存)", () => {
  it.each([
    ["not an object", null],
    ["an empty name", validSave({ values: { name: "" } })],
    ["no items (最低1アイテム必要)", validSave({ items: [] })],
    ["items that are not a list", validSave({ items: "x" })],
    [
      "an item without a name",
      validSave({ items: [recipeItem({ name: "" })] }),
    ],
    [
      "a quantity under 0.5",
      validSave({ items: [recipeItem({ servingQuantity: 0 })] }),
    ],
    ["negative calories", validSave({ items: [recipeItem({ calories: -1 })] })],
    ["a negative cost", validSave({ items: [masterItem({ cost: -1 })] })],
    [
      "a recipe id that is not a uuid",
      validSave({ items: [recipeItem({ recipeId: "recipe-1" })] }),
    ],
    ["a set menu id that is not a uuid", validSave({ id: "set-1" })],
  ])("ui-tech §5: %s is refused with ok:false and nothing is saved", async (_, input) => {
    expect(await saveSetMenu(input)).toEqual({ ok: false });
    expectNothingWritten();
  });

  it("AC-R-5: a new set menu is saved with its items in one call, and the screens are re-read", async () => {
    const result = await saveSetMenu(validSave());

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith(
      "save_set_menu_with_items",
      expect.objectContaining({
        p_id: null,
        p_name: "定食セット",
        p_items: [
          {
            name: "肉じゃが",
            recipe_id: RECIPE_ID,
            food_master_id: null,
            calories: 400,
            protein: 15,
            fat: 10,
            carbs: 50,
            cost: 200,
            serving_quantity: 1,
          },
          {
            name: "ご飯",
            recipe_id: null,
            food_master_id: MASTER_ID,
            calories: 250,
            protein: 4,
            fat: 0.5,
            carbs: 55,
            cost: 50,
            serving_quantity: 1.5,
          },
        ],
      }),
    );
    expectScreensReRead();
  });

  it("S-06a: the totals are each item's values times its quantity, worked out on the server", async () => {
    await saveSetMenu(validSave());

    // 400×1 + 250×1.5 = 775, 15 + 4×1.5 = 21, 10 + 0.5×1.5 = 10.75, 50 + 55×1.5 = 132.5, 200 + 50×1.5 = 275
    expect(rpc).toHaveBeenCalledWith(
      "save_set_menu_with_items",
      expect.objectContaining({
        p_total_calories: 775,
        p_total_protein: 21,
        p_total_fat: 10.75,
        p_total_carbs: 132.5,
        p_total_cost: 275,
      }),
    );
  });

  it("S-06a: totals sent by the client are not used; the saved totals always match the items", async () => {
    await saveSetMenu({
      ...validSave({ items: [recipeItem()] }),
      totals: { calories: 99999, protein: 0, fat: 0, carbs: 0, cost: 0 },
    });

    expect(rpc).toHaveBeenCalledWith(
      "save_set_menu_with_items",
      expect.objectContaining({ p_total_calories: 400, p_total_cost: 200 }),
    );
  });

  it("AC-R-5: an edited set menu is saved over the one with its id", async () => {
    const result = await saveSetMenu(validSave({ id: SET_MENU_ID }));

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith(
      "save_set_menu_with_items",
      expect.objectContaining({ p_id: SET_MENU_ID }),
    );
    expectScreensReRead();
  });

  it("ui-tech フェーズ5: a DB error (the set menu was deleted meanwhile, for example) is a failure and the screens are not re-read", async () => {
    rpcResult = { data: null, error: { message: "set menu not found" } };

    expect(await saveSetMenu(validSave({ id: SET_MENU_ID }))).toEqual({
      ok: false,
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("deleteSetMenu (S-06a セットメニューの削除)", () => {
  it.each([
    ["not an object", null],
    ["no id", {}],
    ["an id that is not a uuid", { id: "set-1" }],
  ])("ui-tech §5: %s is refused with ok:false and nothing is deleted", async (_, input) => {
    expect(await deleteSetMenu(input)).toEqual({ ok: false });
    expectNothingWritten();
  });

  it("AC-R-7: the set menu is soft-deleted (deleted_at), only while it is not deleted yet, and the screens are re-read", async () => {
    const result = await deleteSetMenu({ id: SET_MENU_ID });

    expect(result).toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith("set_menus");
    expect(setMenus.update).toHaveBeenCalledWith({
      deleted_at: expect.any(String),
    });
    expect(setMenus.eq).toHaveBeenCalledWith("id", SET_MENU_ID);
    expect(setMenus.is).toHaveBeenCalledWith("deleted_at", null);
    expectScreensReRead();
  });

  it("ui-tech §5: when no row was hit (unknown or already deleted), it is a failure and the screens are not re-read", async () => {
    setMenus.result = { data: [], error: null };

    expect(await deleteSetMenu({ id: SET_MENU_ID })).toEqual({ ok: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("AC-R-5: a DB error is a failure and the screens are not re-read", async () => {
    setMenus.result = { data: null, error: { message: "denied" } };

    expect(await deleteSetMenu({ id: SET_MENU_ID })).toEqual({ ok: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
