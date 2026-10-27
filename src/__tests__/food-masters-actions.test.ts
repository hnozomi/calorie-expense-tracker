import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteFoodMaster,
  saveFoodMaster,
} from "@/components/features/food-masters/api/actions";

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
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    // biome-ignore lint/suspicious/noThenProperty: the Supabase builder is awaited directly
    then: (
      onFulfilled: (value: QueryResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(query.result).then(onFulfilled, onRejected),
  };
  return query;
};

let foodMasters = createQuery();
const from = vi.fn((_table: string) => foodMasters);
const rpc = vi.fn();
const getClaims = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from, rpc, auth: { getClaims } }),
}));

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

/** Every screen under the root layout is re-read once (AC-R-6: fixing a master changes the home screen) */
const expectScreensReRead = () => {
  expect(revalidatePath).toHaveBeenCalledTimes(1);
  expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
};

const expectNothingWritten = () => {
  expect(from).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
  expect(revalidatePath).not.toHaveBeenCalled();
};

const MASTER_ID = "3f1c2b4a-5d6e-4f70-8a9b-0c1d2e3f4a5b";

const validValues = (overrides: Record<string, unknown> = {}) => ({
  name: "サラダチキン",
  brand: "セブンイレブン",
  category: "bento",
  calories: 110,
  protein: 23.8,
  fat: 1.2,
  carbs: 0.3,
  defaultPrice: 298,
  notes: "棚の右",
  ...overrides,
});

const validSave = (overrides: Record<string, unknown> = {}) => ({
  values: validValues(),
  ...overrides,
});

beforeEach(() => {
  foodMasters = createQuery();
  getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("saveFoodMaster", () => {
  it.each([
    ["not an object", null],
    ["an empty name", validSave({ values: validValues({ name: "" }) })],
    ["negative calories", validSave({ values: validValues({ calories: -1 }) })],
    ["negative fat", validSave({ values: validValues({ fat: -0.1 }) })],
    [
      "a negative price",
      validSave({ values: validValues({ defaultPrice: -1 }) }),
    ],
    [
      "a category that does not exist",
      validSave({ values: validValues({ category: "snacks" }) }),
    ],
    ["an id that is not a uuid", validSave({ id: "fm-1" })],
  ])("ui-tech §5: %s is refused with ok:false and nothing is saved", async (_, input) => {
    expect(await saveFoodMaster(input)).toEqual({ ok: false });
    expectNothingWritten();
  });

  it("AC-R-5: a new master is inserted for the signed-in user and the screens are re-read", async () => {
    const result = await saveFoodMaster(validSave());

    expect(result).toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith("food_masters");
    expect(foodMasters.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      name: "サラダチキン",
      brand: "セブンイレブン",
      category: "bento",
      calories: 110,
      protein: 23.8,
      fat: 1.2,
      carbs: 0.3,
      default_price: 298,
      notes: "棚の右",
    });
    expect(foodMasters.update).not.toHaveBeenCalled();
    expectScreensReRead();
  });

  it("ui-tech §5: empty brand, category, price and notes are stored as nothing (null)", async () => {
    await saveFoodMaster(
      validSave({
        values: validValues({
          brand: "",
          category: undefined,
          defaultPrice: undefined,
          notes: "",
        }),
      }),
    );

    expect(foodMasters.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        brand: null,
        category: null,
        default_price: null,
        notes: null,
      }),
    );
  });

  it("AC-R-6: an edited master overwrites the row with its id, and every screen is re-read", async () => {
    const result = await saveFoodMaster(
      validSave({ id: MASTER_ID, values: validValues({ calories: 120 }) }),
    );

    expect(result).toEqual({ ok: true });
    expect(foodMasters.update).toHaveBeenCalledWith(
      expect.objectContaining({ calories: 120 }),
    );
    expect(foodMasters.eq).toHaveBeenCalledWith("id", MASTER_ID);
    expect(foodMasters.insert).not.toHaveBeenCalled();
    expectScreensReRead();
  });

  it("ui-tech §5: editing a master that was deleted meanwhile (no row hit) is a failure, not a save", async () => {
    foodMasters = createQuery({ data: [], error: null });

    expect(await saveFoodMaster(validSave({ id: MASTER_ID }))).toEqual({
      ok: false,
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("AC-R-5: a DB error is a failure and the screens are not re-read", async () => {
    foodMasters = createQuery({ data: null, error: { message: "boom" } });

    expect(await saveFoodMaster(validSave())).toEqual({ ok: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("ui-tech §5: a signed-out request saves nothing", async () => {
    getClaims.mockResolvedValue({ data: null });

    expect(await saveFoodMaster(validSave())).toEqual({ ok: false });
    expect(foodMasters.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("deleteFoodMaster", () => {
  it.each([
    ["not an object", null],
    ["no id", {}],
    ["an id that is not a uuid", { id: "fm-1" }],
  ])("ui-tech §5: %s is refused with ok:false and nothing is deleted", async (_, input) => {
    expect(await deleteFoodMaster(input)).toEqual({ ok: false });
    expectNothingWritten();
  });

  it("AC-R-5: the master with the id is marked deleted (meals that used it keep their values) and the screens are re-read", async () => {
    expect(await deleteFoodMaster({ id: MASTER_ID })).toEqual({ ok: true });

    expect(from).toHaveBeenCalledWith("food_masters");
    expect(foodMasters.update).toHaveBeenCalledWith({
      deleted_at: expect.any(String),
    });
    expect(foodMasters.delete).not.toHaveBeenCalled();
    expect(foodMasters.eq).toHaveBeenCalledWith("id", MASTER_ID);
    expectScreensReRead();
  });

  it("ui-tech §5: a master that was already deleted (no row hit) is a failure", async () => {
    foodMasters = createQuery({ data: [], error: null });

    expect(await deleteFoodMaster({ id: MASTER_ID })).toEqual({ ok: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("AC-R-5: a DB error is a failure and the screens are not re-read", async () => {
    foodMasters = createQuery({ data: null, error: { message: "boom" } });

    expect(await deleteFoodMaster({ id: MASTER_ID })).toEqual({ ok: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
