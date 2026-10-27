import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteMealPlan,
  saveMealPlan,
  syncMealsToPlans,
  transferPlansToMeals,
} from "@/components/features/plan/api/actions";

type QueryResult = { data?: unknown; error: unknown };

/** A Supabase query builder: every call returns itself, and awaiting it gives the result */
const createQuery = (
  result: QueryResult = { data: [{ id: "x" }], error: null },
) => {
  const query = {
    result,
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
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

let mealPlans = createQuery();
const from = vi.fn((_table: string) => mealPlans);
const rpc = vi.fn(
  async (_name: string, _args: unknown): Promise<QueryResult> => ({
    data: null,
    error: null,
  }),
);
const getClaims = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from, rpc, auth: { getClaims } }),
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

const expectNothingSaved = () => {
  expect(from).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
  expect(revalidatePath).not.toHaveBeenCalled();
};

const PLAN_ID = "3f1c2b4a-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const RECIPE_ID = "7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d";

const validValues = (overrides: Record<string, unknown> = {}) => ({
  plannedName: "カレー",
  calories: 600,
  protein: 20,
  fat: 15,
  carbs: 80,
  estimatedCost: 300,
  ...overrides,
});

const validSave = (overrides: Record<string, unknown> = {}) => ({
  date: "2026-10-21",
  mealType: "dinner",
  values: validValues(),
  recipeId: null,
  foodMasterId: null,
  setMenuId: null,
  ...overrides,
});

beforeEach(() => {
  mealPlans = createQuery();
  getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("saveMealPlan", () => {
  it.each([
    ["not an object", null],
    ["a day that does not exist", validSave({ date: "2026-02-30" })],
    ["a meal type that does not exist", validSave({ mealType: "brunch" })],
    ["an empty name", validSave({ values: validValues({ plannedName: "" }) })],
    ["negative calories", validSave({ values: validValues({ calories: -1 }) })],
    [
      "negative cost",
      validSave({ values: validValues({ estimatedCost: -1 }) }),
    ],
    ["an id that is not a uuid", validSave({ id: "plan-1" })],
    ["a recipe id that is not a uuid", validSave({ recipeId: "recipe-1" })],
  ])("AC-R-5: %s is refused with ok:false and nothing is saved", async (_, input) => {
    expect(await saveMealPlan(input)).toEqual({ ok: false });
    expectNothingSaved();
  });

  it("AC-R-5: a new plan is inserted for the signed-in user and the screens are re-read", async () => {
    const result = await saveMealPlan(validSave({ recipeId: RECIPE_ID }));

    expect(result).toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith("meal_plans");
    expect(mealPlans.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      date: "2026-10-21",
      meal_type: "dinner",
      planned_name: "カレー",
      calories: 600,
      protein: 20,
      fat: 15,
      carbs: 80,
      estimated_cost: 300,
      recipe_id: RECIPE_ID,
      food_master_id: null,
      set_menu_id: null,
    });
    expect(mealPlans.update).not.toHaveBeenCalled();
    expectScreensReRead();
  });

  it("AC-R-5: an edited plan overwrites the row with its id", async () => {
    const result = await saveMealPlan(
      validSave({ id: PLAN_ID, values: validValues({ plannedName: "後" }) }),
    );

    expect(result).toEqual({ ok: true });
    expect(mealPlans.update).toHaveBeenCalledWith(
      expect.objectContaining({ planned_name: "後" }),
    );
    expect(mealPlans.eq).toHaveBeenCalledWith("id", PLAN_ID);
    expect(mealPlans.insert).not.toHaveBeenCalled();
    expectScreensReRead();
  });

  it("AC-R-5: editing a plan that was deleted meanwhile is a failure, not a save", async () => {
    mealPlans = createQuery({ data: [], error: null });

    expect(await saveMealPlan(validSave({ id: PLAN_ID }))).toEqual({
      ok: false,
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("AC-R-5: a DB error is a failure and the screens are not re-read", async () => {
    mealPlans = createQuery({ data: null, error: { message: "boom" } });

    expect(await saveMealPlan(validSave())).toEqual({ ok: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("AC-R-5: a signed-out request saves nothing", async () => {
    getClaims.mockResolvedValue({ data: null });

    expect(await saveMealPlan(validSave())).toEqual({ ok: false });
    expect(mealPlans.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("deleteMealPlan", () => {
  it.each([
    ["not an object", null],
    ["an id that is not a uuid", { id: "plan-1" }],
  ])("AC-R-5: %s is refused with ok:false and nothing is deleted", async (_, input) => {
    expect(await deleteMealPlan(input)).toEqual({ ok: false });
    expectNothingSaved();
  });

  it("AC-R-5: deletes the plan with its id and re-reads the screens", async () => {
    expect(await deleteMealPlan({ id: PLAN_ID })).toEqual({ ok: true });
    expect(mealPlans.delete).toHaveBeenCalled();
    expect(mealPlans.eq).toHaveBeenCalledWith("id", PLAN_ID);
    expectScreensReRead();
  });

  it("AC-R-5: a plan that was already gone is a failure", async () => {
    mealPlans = createQuery({ data: [], error: null });

    expect(await deleteMealPlan({ id: PLAN_ID })).toEqual({ ok: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("transferPlansToMeals", () => {
  it.each([
    ["not an object", null],
    ["no slot", { date: "2026-10-20", mealTypes: [] }],
    ["a day that does not exist", { date: "2026-13-01", mealTypes: ["lunch"] }],
    [
      "a meal type that does not exist",
      { date: "2026-10-20", mealTypes: ["brunch"] },
    ],
  ])("AC-R-5: %s is refused with ok:false and nothing is moved", async (_, input) => {
    expect(await transferPlansToMeals(input)).toEqual({ ok: false });
    expectNothingSaved();
  });

  it("AC-R-6: moves each slot of the day and re-reads the screens, so home shows them", async () => {
    const result = await transferPlansToMeals({
      date: "2026-10-20",
      mealTypes: ["breakfast", "dinner"],
    });

    expect(result).toEqual({ ok: true, transferredCount: 2 });
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenNthCalledWith(1, "transfer_plan_to_meal", {
      p_target_date: "2026-10-20",
      p_meal_type: "breakfast",
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "transfer_plan_to_meal", {
      p_target_date: "2026-10-20",
      p_meal_type: "dinner",
    });
    expectScreensReRead();
  });

  it("AC-R-5: stops at the first slot that fails and reports how many were moved", async () => {
    rpc
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "boom" } });

    const result = await transferPlansToMeals({
      date: "2026-10-20",
      mealTypes: ["breakfast", "lunch", "dinner"],
    });

    expect(result).toEqual({ ok: true, transferredCount: 1 });
    expect(rpc).toHaveBeenCalledTimes(2);
    expectScreensReRead();
  });

  it("AC-R-5: when no slot could be moved, the screens are not re-read", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "boom" } });

    const result = await transferPlansToMeals({
      date: "2026-10-20",
      mealTypes: ["lunch"],
    });

    expect(result).toEqual({ ok: true, transferredCount: 0 });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("syncMealsToPlans", () => {
  it.each([
    ["not an object", null],
    ["a start that is not a day", { startDate: "x", endDate: "2026-10-20" }],
    [
      "an end that is not a day",
      { startDate: "2026-10-19", endDate: "2026-10-32" },
    ],
  ])("AC-R-5: %s is refused with ok:false", async (_, input) => {
    expect(await syncMealsToPlans(input)).toEqual({ ok: false });
    expectNothingSaved();
  });

  it("P-2: replaces the days in the range and says how many slots were replaced", async () => {
    rpc.mockResolvedValueOnce({ data: 3, error: null });

    const result = await syncMealsToPlans({
      startDate: "2026-10-19",
      endDate: "2026-10-20",
    });

    expect(result).toEqual({ ok: true, replacedCount: 3 });
    expect(rpc).toHaveBeenCalledWith("sync_meals_to_plans", {
      p_start_date: "2026-10-19",
      p_end_date: "2026-10-20",
    });
    expectScreensReRead();
  });

  it("AC-R-5: a DB error is a failure", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "boom" } });

    expect(
      await syncMealsToPlans({
        startDate: "2026-10-19",
        endDate: "2026-10-20",
      }),
    ).toEqual({ ok: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
