import { describe, expect, it } from "vitest";
import { calculateSetMenuTotals } from "@/components/features/set-menus/utils/set-menu-totals";

// S-06a: 合計カロリー・PFC・食費は全アイテムの値から自動計算する。分量変更で再計算する

const item = (
  values: Partial<{
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    cost: number;
    servingQuantity: number;
  }> = {},
) => ({
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  cost: 0,
  servingQuantity: 1,
  ...values,
});

describe("calculateSetMenuTotals (S-06a の合計)", () => {
  it("S-06a: アイテムが無ければ、合計はすべて 0", () => {
    expect(calculateSetMenuTotals([])).toEqual({
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      cost: 0,
    });
  });

  it("S-06a: 全アイテムのカロリー・PFC・食費を足す", () => {
    const totals = calculateSetMenuTotals([
      item({ calories: 250, protein: 4, fat: 0.5, carbs: 55, cost: 50 }),
      item({ calories: 50, protein: 3, fat: 1.5, carbs: 5, cost: 30 }),
    ]);

    expect(totals).toEqual({
      calories: 300,
      protein: 7,
      fat: 2,
      carbs: 60,
      cost: 80,
    });
  });

  it("S-06a: 各アイテムの値に分量を掛けてから足す", () => {
    const totals = calculateSetMenuTotals([
      item({
        calories: 200,
        protein: 10,
        fat: 4,
        carbs: 30,
        cost: 100,
        servingQuantity: 1.5,
      }),
      item({
        calories: 90,
        protein: 8,
        fat: 5,
        carbs: 6,
        cost: 60,
        servingQuantity: 2,
      }),
    ]);

    expect(totals).toEqual({
      calories: 480,
      protein: 31,
      fat: 16,
      carbs: 57,
      cost: 270,
    });
  });

  it("S-06a: 分量は 0.5 刻みの最小 0.5 でも、半分として計算する", () => {
    const totals = calculateSetMenuTotals([
      item({ calories: 300, cost: 120, servingQuantity: 0.5 }),
    ]);

    expect(totals.calories).toBe(150);
    expect(totals.cost).toBe(60);
  });
});
