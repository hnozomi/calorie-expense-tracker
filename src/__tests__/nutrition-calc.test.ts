import { describe, expect, it } from "vitest";
import {
  sumCost,
  sumNutrition,
} from "@/components/features/meals/utils/nutrition-calc";

describe("sumNutrition", () => {
  it("returns zeros for an empty array", () => {
    expect(sumNutrition([])).toEqual({
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    });
  });

  it("returns the same values for a single item", () => {
    const item = { calories: 500, protein: 30, fat: 20, carbs: 50 };
    expect(sumNutrition([item])).toEqual(item);
  });

  it("sums multiple items correctly", () => {
    const items = [
      { calories: 300, protein: 20, fat: 10, carbs: 30 },
      { calories: 200, protein: 15, fat: 5, carbs: 25 },
      { calories: 100, protein: 5, fat: 3, carbs: 10 },
    ];
    expect(sumNutrition(items)).toEqual({
      calories: 600,
      protein: 40,
      fat: 18,
      carbs: 65,
    });
  });

  it("handles decimal values without floating point errors", () => {
    const items = [
      { calories: 100.5, protein: 10.1, fat: 5.2, carbs: 15.3 },
      { calories: 200.3, protein: 20.2, fat: 10.4, carbs: 30.6 },
    ];
    const result = sumNutrition(items);
    expect(result.calories).toBeCloseTo(300.8);
    expect(result.protein).toBeCloseTo(30.3);
    expect(result.fat).toBeCloseTo(15.6);
    expect(result.carbs).toBeCloseTo(45.9);
  });

  it("handles items with zero values", () => {
    const items = [
      { calories: 0, protein: 0, fat: 0, carbs: 0 },
      { calories: 100, protein: 10, fat: 5, carbs: 20 },
    ];
    expect(sumNutrition(items)).toEqual({
      calories: 100,
      protein: 10,
      fat: 5,
      carbs: 20,
    });
  });
});

describe("sumCost", () => {
  it("returns 0 for an empty array", () => {
    expect(sumCost([])).toBe(0);
  });

  it("sums numeric cost values", () => {
    const items = [{ cost: 300 }, { cost: 200 }, { cost: 150 }];
    expect(sumCost(items)).toBe(650);
  });

  it("treats null cost as 0", () => {
    const items = [{ cost: 300 }, { cost: null }, { cost: 200 }];
    expect(sumCost(items)).toBe(500);
  });

  it("treats undefined cost as 0", () => {
    const items = [{ cost: 100 }, { cost: undefined }];
    expect(sumCost(items)).toBe(100);
  });

  it("returns 0 when all costs are null", () => {
    const items = [{ cost: null }, { cost: null }];
    expect(sumCost(items)).toBe(0);
  });
});
