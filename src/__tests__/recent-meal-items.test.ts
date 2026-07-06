import { describe, expect, it } from "vitest";
import {
  dedupeRecentItemsByName,
  type RecentMealItem,
} from "@/components/features/meals/utils/recent-meal-items";

const createItem = (
  overrides: Partial<RecentMealItem> = {},
): RecentMealItem => ({
  name: "テスト品",
  calories: 300,
  protein: 10,
  fat: 5,
  carbs: 40,
  cost: null,
  sourceType: "manual",
  recipeId: null,
  foodMasterId: null,
  setMenuId: null,
  ...overrides,
});

describe("dedupeRecentItemsByName", () => {
  it("空配列を渡すと空配列を返す", () => {
    expect(dedupeRecentItemsByName([], 20)).toEqual([]);
  });

  it("同名アイテムは先頭(最新)のみ残る", () => {
    const items = [
      createItem({ name: "ヨーグルト", calories: 120 }),
      createItem({ name: "トースト" }),
      createItem({ name: "ヨーグルト", calories: 100 }),
    ];
    const result = dedupeRecentItemsByName(items, 20);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ name: "ヨーグルト", calories: 120 });
  });

  it("前後空白のみ異なる名前は同一として扱う", () => {
    const items = [createItem({ name: "そば " }), createItem({ name: "そば" })];
    expect(dedupeRecentItemsByName(items, 20)).toHaveLength(1);
  });

  it("空文字・空白のみの名前は除外される", () => {
    const items = [createItem({ name: "" }), createItem({ name: "  " })];
    expect(dedupeRecentItemsByName(items, 20)).toHaveLength(0);
  });

  it("limitで件数が打ち切られる", () => {
    const items = [
      createItem({ name: "一品目" }),
      createItem({ name: "二品目" }),
      createItem({ name: "三品目" }),
    ];
    const result = dedupeRecentItemsByName(items, 2);
    expect(result.map((item) => item.name)).toEqual(["一品目", "二品目"]);
  });
});
