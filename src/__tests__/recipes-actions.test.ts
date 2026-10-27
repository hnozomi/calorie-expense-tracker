import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteRecipe,
  saveRecipe,
} from "@/components/features/recipes/api/actions";

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

let recipes = createQuery();
const from = vi.fn((_table: string) => recipes);
let rpcResult: QueryResult = { data: "new-id", error: null };
const rpc = vi.fn(async (_name: string, _args: unknown) => rpcResult);
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

const expectNothingWritten = () => {
  expect(from).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
  expect(revalidatePath).not.toHaveBeenCalled();
};

const RECIPE_ID = "7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d";

const validValues = (overrides: Record<string, unknown> = {}) => ({
  name: "肉じゃが",
  servings: 2,
  calories: 800,
  protein: 30,
  fat: 20,
  carbs: 100,
  notes: "甘め",
  ...overrides,
});

const validIngredient = (overrides: Record<string, unknown> = {}) => ({
  ingredientName: "じゃがいも",
  quantity: 3,
  unit: "個",
  unitPrice: 40,
  ...overrides,
});

const validSave = (overrides: Record<string, unknown> = {}) => ({
  values: validValues(),
  ingredients: [validIngredient()],
  ...overrides,
});

beforeEach(() => {
  recipes = createQuery();
  rpcResult = { data: "new-id", error: null };
  getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("saveRecipe", () => {
  it.each([
    ["not an object", null],
    ["an empty name", validSave({ values: validValues({ name: "" }) })],
    ["0 servings", validSave({ values: validValues({ servings: 0 }) })],
    [
      "a fraction of a serving",
      validSave({ values: validValues({ servings: 1.5 }) }),
    ],
    ["negative calories", validSave({ values: validValues({ calories: -1 }) })],
    ["negative protein", validSave({ values: validValues({ protein: -1 }) })],
    ["an id that is not a uuid", validSave({ id: "recipe-1" })],
    ["ingredients that are not a list", validSave({ ingredients: "x" })],
    [
      "an ingredient without a name",
      validSave({ ingredients: [validIngredient({ ingredientName: "" })] }),
    ],
    [
      "an ingredient with a negative quantity",
      validSave({ ingredients: [validIngredient({ quantity: -1 })] }),
    ],
    [
      "an ingredient with a negative unit price",
      validSave({ ingredients: [validIngredient({ unitPrice: -1 })] }),
    ],
  ])("ui-tech §5: %s is refused with ok:false and nothing is saved", async (_, input) => {
    expect(await saveRecipe(input)).toEqual({ ok: false });
    expectNothingWritten();
  });

  it("AC-R-5: a new recipe is saved with its ingredients in one call, and the screens are re-read", async () => {
    const result = await saveRecipe(validSave());

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("save_recipe_with_ingredients", {
      p_id: null,
      p_name: "肉じゃが",
      p_servings: 2,
      p_calories: 800,
      p_protein: 30,
      p_fat: 20,
      p_carbs: 100,
      p_notes: "甘め",
      p_ingredients: [
        {
          ingredient_name: "じゃがいも",
          quantity: 3,
          unit: "個",
          unit_price: 40,
        },
      ],
    });
    expectScreensReRead();
  });

  it("AC-R-5: an edited recipe is saved over the one with its id", async () => {
    const result = await saveRecipe(validSave({ id: RECIPE_ID }));

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith(
      "save_recipe_with_ingredients",
      expect.objectContaining({ p_id: RECIPE_ID }),
    );
    expectScreensReRead();
  });

  it("ui-tech §5: empty notes are stored as nothing (null), not as an empty text", async () => {
    await saveRecipe(validSave({ values: validValues({ notes: "" }) }));

    expect(rpc).toHaveBeenCalledWith(
      "save_recipe_with_ingredients",
      expect.objectContaining({ p_notes: null }),
    );
  });

  it("ui-tech §5: numbers typed into the form as text are taken as numbers", async () => {
    await saveRecipe(
      validSave({
        values: validValues({ servings: "3", calories: "450" }),
        ingredients: [validIngredient({ quantity: "2", unitPrice: "30" })],
      }),
    );

    expect(rpc).toHaveBeenCalledWith(
      "save_recipe_with_ingredients",
      expect.objectContaining({
        p_servings: 3,
        p_calories: 450,
        p_ingredients: [
          expect.objectContaining({ quantity: 2, unit_price: 30 }),
        ],
      }),
    );
  });

  it("AC-R-5: a DB error (the recipe was not found, for example) is a failure and the screens are not re-read", async () => {
    rpcResult = { data: null, error: { message: "recipe not found" } };

    expect(await saveRecipe(validSave({ id: RECIPE_ID }))).toEqual({
      ok: false,
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("deleteRecipe", () => {
  it.each([
    ["not an object", null],
    ["no id", {}],
    ["an id that is not a uuid", { id: "recipe-1" }],
  ])("ui-tech §5: %s is refused with ok:false and nothing is deleted", async (_, input) => {
    expect(await deleteRecipe(input)).toEqual({ ok: false });
    expectNothingWritten();
  });

  it("AC-R-5: the recipe with the id is marked deleted (meals that used it keep their values) and the screens are re-read", async () => {
    expect(await deleteRecipe({ id: RECIPE_ID })).toEqual({ ok: true });

    expect(from).toHaveBeenCalledWith("recipes");
    expect(recipes.update).toHaveBeenCalledWith({
      deleted_at: expect.any(String),
    });
    expect(recipes.delete).not.toHaveBeenCalled();
    expect(recipes.eq).toHaveBeenCalledWith("id", RECIPE_ID);
    expectScreensReRead();
  });

  it("ui-tech §5: a recipe that was already deleted (no row hit) is a failure", async () => {
    recipes = createQuery({ data: [], error: null });

    expect(await deleteRecipe({ id: RECIPE_ID })).toEqual({ ok: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("AC-R-5: a DB error is a failure and the screens are not re-read", async () => {
    recipes = createQuery({ data: null, error: { message: "boom" } });

    expect(await deleteRecipe({ id: RECIPE_ID })).toEqual({ ok: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
