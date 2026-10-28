import { describe, expect, it } from "vitest";
import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import type { SetMenuItemDraft } from "@/components/features/set-menus/types/set-menu";
import {
  foodMasterCaloriesLabel,
  recipeCaloriesLabel,
  scaledItemValues,
} from "@/components/features/set-menus/utils/display-values";

// S-06a: レシピ・食品マスタから選んで構成する。レシピは1人分の値で加わる(01 ユースケース)。
// 分量を変えるとアイテムのカロリー・食費が変わる

const recipe = (values: Partial<Recipe> = {}): Recipe => ({
  id: "recipe-1",
  userId: "user-1",
  name: "肉じゃが",
  servings: 1,
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  notes: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ingredients: [],
  ...values,
});

const foodMaster = (values: Partial<FoodMaster> = {}): FoodMaster => ({
  id: "fm-1",
  userId: "user-1",
  name: "納豆",
  brand: null,
  category: null,
  defaultPrice: null,
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  notes: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...values,
});

const item = (values: Partial<SetMenuItemDraft> = {}): SetMenuItemDraft => ({
  tempId: "temp-1",
  name: "ご飯",
  recipeId: null,
  foodMasterId: "fm-rice",
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  cost: 0,
  servingQuantity: 1,
  ...values,
});

describe("recipeCaloriesLabel (S-06a 追加の候補のレシピ)", () => {
  it("S-06a: レシピのカロリーは人数で割った1人分を「kcal/人」で出す", () => {
    expect(recipeCaloriesLabel(recipe({ calories: 1200, servings: 4 }))).toBe(
      "300 kcal/人",
    );
  });

  it("S-06a: 1人分が割り切れないときは整数に丸める", () => {
    expect(recipeCaloriesLabel(recipe({ calories: 1000, servings: 3 }))).toBe(
      "333 kcal/人",
    );
    expect(recipeCaloriesLabel(recipe({ calories: 500, servings: 3 }))).toBe(
      "167 kcal/人",
    );
  });
});

describe("foodMasterCaloriesLabel (S-06a 追加の候補の食品マスタ)", () => {
  it("S-06a: 食品マスタのカロリーは、そのままの値を整数に丸めて「kcal」で出す", () => {
    expect(foodMasterCaloriesLabel(foodMaster({ calories: 90 }))).toBe(
      "90 kcal",
    );
    expect(foodMasterCaloriesLabel(foodMaster({ calories: 95.6 }))).toBe(
      "96 kcal",
    );
  });
});

describe("scaledItemValues (S-06a アイテムの行)", () => {
  it("S-06a: 分量 1 なら、アイテムのカロリー・食費をそのまま出す", () => {
    expect(scaledItemValues(item({ calories: 250, cost: 50 }))).toEqual({
      calories: 250,
      cost: 50,
    });
  });

  it("S-06a: カロリー・食費に分量を掛ける(0.5 刻みの分量)", () => {
    expect(
      scaledItemValues(item({ calories: 250, cost: 50, servingQuantity: 1.5 })),
    ).toEqual({ calories: 375, cost: 75 });
    expect(
      scaledItemValues(
        item({ calories: 300, cost: 120, servingQuantity: 0.5 }),
      ),
    ).toEqual({ calories: 150, cost: 60 });
  });

  it("S-06a: 掛けた結果が整数でなければ、整数に丸めて出す", () => {
    expect(
      scaledItemValues(item({ calories: 333, cost: 45, servingQuantity: 1.5 })),
    ).toEqual({ calories: 500, cost: 68 });
  });
});
