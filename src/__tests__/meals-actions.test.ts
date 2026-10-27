import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  copyPreviousDayMeal,
  deleteMealItem,
  registerMealItems,
  transferMealToPlan,
  updateMealItem,
} from "@/components/features/meals/api/actions";

type QueryResult = { data?: unknown; error: unknown };

/** A Supabase query builder: every filter returns itself, and awaiting it (or single/maybeSingle) gives the result */
const createQuery = (result: QueryResult = { data: null, error: null }) => {
  const query = {
    result,
    singleResult: result,
    maybeSingleResult: result,
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    order: vi.fn(() => query),
    upsert: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    single: vi.fn(async () => query.singleResult),
    maybeSingle: vi.fn(async () => query.maybeSingleResult),
    // biome-ignore lint/suspicious/noThenProperty: the Supabase builder is awaited directly
    then: (
      onFulfilled: (value: QueryResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(query.result).then(onFulfilled, onRejected),
  };
  return query;
};

let tables: Record<string, ReturnType<typeof createQuery>> = {};
const from = vi.fn((table: string) => {
  tables[table] ??= createQuery();
  return tables[table];
});
const rpc = vi.fn(async (): Promise<QueryResult> => ({ error: null }));
const getClaims = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from, rpc, auth: { getClaims } }),
}));

const revalidateApp = vi.fn(async () => {});
vi.mock("@/lib/revalidate", () => ({
  revalidateApp: () => revalidateApp(),
}));

const ITEM_ID = "3f1c2b4a-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const FOOD_MASTER_ID = "7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d";

const signedIn = () =>
  getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
const signedOut = () => getClaims.mockResolvedValue({ data: null });

/** The meals table answers the upsert of today's meal row with this id */
const mealRowCreated = (id = "meal-today") => {
  const meals = createQuery();
  meals.singleResult = { data: { id }, error: null };
  tables.meals = meals;
  return meals;
};

beforeEach(() => {
  tables = {};
  signedIn();
});

afterEach(() => {
  vi.clearAllMocks();
});

const expectNothingSaved = () => {
  expect(from).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
  expect(revalidateApp).not.toHaveBeenCalled();
};

const validDraft = (overrides: Record<string, unknown> = {}) => ({
  tempId: "temp-1",
  name: "親子丼",
  calories: 650,
  protein: 30,
  fat: 15,
  carbs: 90,
  sourceType: "manual",
  ...overrides,
});

describe("registerMealItems", () => {
  it.each([
    ["not an object", null],
    ["no items", { date: "2026-10-20", mealType: "lunch", items: [] }],
    [
      "a day that does not exist",
      { date: "2026-02-30", mealType: "lunch", items: [validDraft()] },
    ],
    [
      "a meal type that does not exist",
      { date: "2026-10-20", mealType: "brunch", items: [validDraft()] },
    ],
    [
      "negative calories",
      {
        date: "2026-10-20",
        mealType: "lunch",
        items: [validDraft({ calories: -1 })],
      },
    ],
    [
      "an empty name",
      {
        date: "2026-10-20",
        mealType: "lunch",
        items: [validDraft({ name: "" })],
      },
    ],
    [
      "a master id that is not a uuid",
      {
        date: "2026-10-20",
        mealType: "lunch",
        items: [
          validDraft({ sourceType: "food_master", foodMasterId: "fm-1" }),
        ],
      },
    ],
    [
      "an unknown source type",
      {
        date: "2026-10-20",
        mealType: "lunch",
        items: [validDraft({ sourceType: "camera" })],
      },
    ],
  ])("AC-R-5: %s is refused with ok:false and nothing is saved", async (_, input) => {
    expect(await registerMealItems(input)).toEqual({ ok: false });
    expectNothingSaved();
  });

  it("AC-R-5: saves the drafts in the slot's meal row in one RPC and re-reads the screens", async () => {
    const meals = mealRowCreated("meal-today");

    const result = await registerMealItems({
      date: "2026-10-20",
      mealType: "lunch",
      items: [
        validDraft(),
        validDraft({
          tempId: "temp-2",
          name: "納豆",
          calories: 90,
          protein: 7,
          fat: 4.5,
          carbs: 5,
          cost: 50,
          sourceType: "food_master",
          foodMasterId: FOOD_MASTER_ID,
        }),
      ],
    });

    expect(result).toEqual({ ok: true });
    expect(meals.upsert).toHaveBeenCalledWith(
      { date: "2026-10-20", meal_type: "lunch", user_id: "user-1" },
      expect.anything(),
    );
    expect(rpc).toHaveBeenCalledWith("register_meal_items", {
      p_meal_id: "meal-today",
      p_items: [
        {
          name: "親子丼",
          calories: 650,
          protein: 30,
          fat: 15,
          carbs: 90,
          cost: null,
          source_type: "manual",
          food_master_id: null,
          recipe_id: null,
          set_menu_id: null,
        },
        {
          name: "納豆",
          calories: 90,
          protein: 7,
          fat: 4.5,
          carbs: 5,
          cost: 50,
          source_type: "food_master",
          food_master_id: FOOD_MASTER_ID,
          recipe_id: null,
          set_menu_id: null,
        },
      ],
    });
    expect(revalidateApp).toHaveBeenCalledTimes(1);
  });

  it("AC-R-5: without a signed-in user nothing is saved", async () => {
    signedOut();
    mealRowCreated();

    const result = await registerMealItems({
      date: "2026-10-20",
      mealType: "lunch",
      items: [validDraft()],
    });

    expect(result).toEqual({ ok: false });
    expect(rpc).not.toHaveBeenCalled();
    expect(revalidateApp).not.toHaveBeenCalled();
  });

  it("AC-R-5: when the meal row cannot be made, the items are not added", async () => {
    const meals = createQuery();
    meals.singleResult = { data: null, error: { message: "denied" } };
    tables.meals = meals;

    const result = await registerMealItems({
      date: "2026-10-20",
      mealType: "lunch",
      items: [validDraft()],
    });

    expect(result).toEqual({ ok: false });
    expect(rpc).not.toHaveBeenCalled();
    expect(revalidateApp).not.toHaveBeenCalled();
  });

  it("AC-R-5: when the RPC fails it returns ok:false and does not re-read", async () => {
    mealRowCreated();
    rpc.mockResolvedValueOnce({ error: { message: "network" } });

    const result = await registerMealItems({
      date: "2026-10-20",
      mealType: "lunch",
      items: [validDraft()],
    });

    expect(result).toEqual({ ok: false });
    expect(revalidateApp).not.toHaveBeenCalled();
  });
});

describe("updateMealItem", () => {
  const values = {
    name: "ポテチ(大)",
    calories: 250,
    protein: 3,
    fat: 15,
    carbs: 25,
    cost: 180,
  };

  it.each([
    ["not an object", "item-1"],
    ["an item id that is not a uuid", { itemId: "item-1", values }],
    ["no values", { itemId: ITEM_ID }],
    [
      "negative calories",
      { itemId: ITEM_ID, values: { ...values, calories: -5 } },
    ],
  ])("S-02a: %s is refused with ok:false and nothing is saved", async (_, input) => {
    expect(await updateMealItem(input)).toEqual({ ok: false });
    expectNothingSaved();
  });

  it("S-02a: overwrites the item's name, nutrition and cost, then re-reads the screens", async () => {
    const result = await updateMealItem({ itemId: ITEM_ID, values });

    expect(result).toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith("meal_items");
    expect(tables.meal_items.update).toHaveBeenCalledWith(values);
    expect(tables.meal_items.eq).toHaveBeenCalledWith("id", ITEM_ID);
    expect(revalidateApp).toHaveBeenCalledTimes(1);
  });

  it("S-02a: an empty cost is saved as no cost (null)", async () => {
    const { cost: _, ...withoutCost } = values;
    await updateMealItem({ itemId: ITEM_ID, values: withoutCost });
    expect(tables.meal_items.update).toHaveBeenCalledWith(
      expect.objectContaining({ cost: null }),
    );
  });

  it("AC-R-5: when the update fails it returns ok:false and does not re-read", async () => {
    tables.meal_items = createQuery({ error: { message: "network" } });

    expect(await updateMealItem({ itemId: ITEM_ID, values })).toEqual({
      ok: false,
    });
    expect(revalidateApp).not.toHaveBeenCalled();
  });
});

describe("deleteMealItem", () => {
  it.each([
    ["not an object", ITEM_ID],
    ["an item id that is not a uuid", { itemId: "item-1" }],
  ])("S-02a: %s is refused with ok:false and nothing is deleted", async (_, input) => {
    expect(await deleteMealItem(input)).toEqual({ ok: false });
    expectNothingSaved();
  });

  it("S-02a: deletes the item and re-reads the screens", async () => {
    const result = await deleteMealItem({ itemId: ITEM_ID });

    expect(result).toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith("meal_items");
    expect(tables.meal_items.delete).toHaveBeenCalled();
    expect(tables.meal_items.eq).toHaveBeenCalledWith("id", ITEM_ID);
    expect(revalidateApp).toHaveBeenCalledTimes(1);
  });

  it("AC-R-5: when the delete fails it returns ok:false and does not re-read", async () => {
    tables.meal_items = createQuery({ error: { message: "network" } });

    expect(await deleteMealItem({ itemId: ITEM_ID })).toEqual({ ok: false });
    expect(revalidateApp).not.toHaveBeenCalled();
  });
});

const previousItemRow = (overrides: Record<string, unknown> = {}) => ({
  name: "ラーメン",
  calories: 600,
  protein: 20,
  fat: 18,
  carbs: 80,
  cost: 900,
  source_type: "manual",
  food_master_id: null,
  recipe_id: null,
  set_menu_id: null,
  sort_order: 0,
  ...overrides,
});

/** The meals table answers the previous day's lookup with this, and the upsert of today's row with meal-today */
const previousDayMeal = (previous: QueryResult) => {
  const meals = mealRowCreated("meal-today");
  meals.maybeSingleResult = previous;
  return meals;
};

describe("copyPreviousDayMeal", () => {
  it.each([
    ["not an object", undefined],
    ["a day that does not exist", { date: "2026-13-01", mealType: "dinner" }],
    [
      "a meal type that does not exist",
      { date: "2026-07-07", mealType: "brunch" },
    ],
  ])("QA-1: %s is refused with ok:false and nothing is copied", async (_, input) => {
    expect(await copyPreviousDayMeal(input)).toEqual({ ok: false });
    expectNothingSaved();
  });

  it("QA-1: looks up the same slot on the day before", async () => {
    const meals = previousDayMeal({ data: null, error: null });

    await copyPreviousDayMeal({ date: "2026-07-01", mealType: "dinner" });

    expect(meals.eq).toHaveBeenCalledWith("date", "2026-06-30");
    expect(meals.eq).toHaveBeenCalledWith("meal_type", "dinner");
  });

  it("QA-1: when the day before has no record it copies 0 items and saves nothing", async () => {
    const meals = previousDayMeal({ data: null, error: null });

    const result = await copyPreviousDayMeal({
      date: "2026-07-07",
      mealType: "dinner",
    });

    expect(result).toEqual({ ok: true, copiedCount: 0 });
    expect(rpc).not.toHaveBeenCalled();
    expect(meals.upsert).not.toHaveBeenCalled();
    expect(revalidateApp).not.toHaveBeenCalled();
  });

  it("QA-1: copies every item of the day before with its fields, and re-reads the screens", async () => {
    previousDayMeal({
      data: {
        id: "meal-yesterday",
        meal_items: [
          previousItemRow({ recipe_id: "recipe-1", source_type: "recipe" }),
        ],
      },
      error: null,
    });

    const result = await copyPreviousDayMeal({
      date: "2026-07-07",
      mealType: "dinner",
    });

    expect(result).toEqual({ ok: true, copiedCount: 1 });
    expect(rpc).toHaveBeenCalledWith("register_meal_items", {
      p_meal_id: "meal-today",
      p_items: [
        {
          name: "ラーメン",
          calories: 600,
          protein: 20,
          fat: 18,
          carbs: 80,
          cost: 900,
          source_type: "recipe",
          food_master_id: null,
          recipe_id: "recipe-1",
          set_menu_id: null,
        },
      ],
    });
    expect(revalidateApp).toHaveBeenCalledTimes(1);
  });

  it("QA-1: the items are copied in sort_order", async () => {
    previousDayMeal({
      data: {
        id: "meal-yesterday",
        meal_items: [
          previousItemRow({ name: "二品目", sort_order: 1 }),
          previousItemRow({ name: "一品目", sort_order: 0 }),
        ],
      },
      error: null,
    });

    await copyPreviousDayMeal({ date: "2026-07-07", mealType: "lunch" });

    const [, args] = rpc.mock.calls[0] as unknown as [
      string,
      { p_items: { name: string }[] },
    ];
    expect(args.p_items.map((item) => item.name)).toEqual(["一品目", "二品目"]);
  });

  it("AC-R-5: when the day before cannot be read it returns ok:false and copies nothing", async () => {
    previousDayMeal({ data: null, error: { message: "network error" } });

    const result = await copyPreviousDayMeal({
      date: "2026-07-07",
      mealType: "dinner",
    });

    expect(result).toEqual({ ok: false });
    expect(rpc).not.toHaveBeenCalled();
    expect(revalidateApp).not.toHaveBeenCalled();
  });

  it("AC-R-5: when saving the copies fails it returns ok:false", async () => {
    previousDayMeal({
      data: { id: "meal-yesterday", meal_items: [previousItemRow()] },
      error: null,
    });
    rpc.mockResolvedValueOnce({ error: { message: "network" } });

    expect(
      await copyPreviousDayMeal({ date: "2026-07-07", mealType: "dinner" }),
    ).toEqual({ ok: false });
    expect(revalidateApp).not.toHaveBeenCalled();
  });
});

describe("transferMealToPlan", () => {
  it.each([
    ["not an object", "2026-10-20"],
    ["a day that does not exist", { date: "2026-02-30", mealType: "snack" }],
    [
      "a meal type that does not exist",
      { date: "2026-10-20", mealType: "brunch" },
    ],
  ])("MI-2: %s is refused with ok:false and nothing is added to the plan", async (_, input) => {
    expect(await transferMealToPlan(input)).toEqual({ ok: false });
    expectNothingSaved();
  });

  it("MI-2 / AC-R-6: adds the slot to the plan of the same day and re-reads every screen", async () => {
    const result = await transferMealToPlan({
      date: "2026-10-20",
      mealType: "snack",
    });

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("transfer_meal_to_plan", {
      p_target_date: "2026-10-20",
      p_meal_type: "snack",
    });
    expect(revalidateApp).toHaveBeenCalledTimes(1);
  });

  it("AC-R-5: when the RPC fails it returns ok:false and does not re-read", async () => {
    rpc.mockResolvedValueOnce({ error: { message: "network" } });

    expect(
      await transferMealToPlan({ date: "2026-10-20", mealType: "snack" }),
    ).toEqual({ ok: false });
    expect(revalidateApp).not.toHaveBeenCalled();
  });
});
