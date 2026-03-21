import { describe, expect, it } from "vitest";
import { mealItemFormSchema } from "@/components/features/meals/types/meal";

describe("mealItemFormSchema", () => {
  it("validates a complete valid input", () => {
    const input = {
      name: "サラダチキン",
      calories: 120,
      protein: 25,
      fat: 2,
      carbs: 1,
      cost: 250,
    };
    const result = mealItemFormSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("validates input without optional cost", () => {
    const input = {
      name: "サラダチキン",
      calories: 120,
      protein: 25,
      fat: 2,
      carbs: 1,
    };
    const result = mealItemFormSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("coerces string numbers to numbers", () => {
    const input = {
      name: "おにぎり",
      calories: "200",
      protein: "5",
      fat: "1",
      carbs: "40",
      cost: "120",
    };
    const result = mealItemFormSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.calories).toBe(200);
      expect(result.data.protein).toBe(5);
      expect(result.data.cost).toBe(120);
    }
  });

  it("rejects empty name", () => {
    const input = {
      name: "",
      calories: 100,
      protein: 10,
      fat: 5,
      carbs: 20,
    };
    const result = mealItemFormSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects negative calories", () => {
    const input = {
      name: "テスト",
      calories: -10,
      protein: 0,
      fat: 0,
      carbs: 0,
    };
    const result = mealItemFormSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects negative PFC values", () => {
    const negativeProtein = {
      name: "テスト",
      calories: 100,
      protein: -1,
      fat: 0,
      carbs: 0,
    };
    expect(mealItemFormSchema.safeParse(negativeProtein).success).toBe(false);

    const negativeFat = {
      name: "テスト",
      calories: 100,
      protein: 0,
      fat: -1,
      carbs: 0,
    };
    expect(mealItemFormSchema.safeParse(negativeFat).success).toBe(false);

    const negativeCarbs = {
      name: "テスト",
      calories: 100,
      protein: 0,
      fat: 0,
      carbs: -1,
    };
    expect(mealItemFormSchema.safeParse(negativeCarbs).success).toBe(false);
  });

  it("rejects negative cost", () => {
    const input = {
      name: "テスト",
      calories: 100,
      protein: 10,
      fat: 5,
      carbs: 20,
      cost: -100,
    };
    const result = mealItemFormSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts zero values for all numeric fields", () => {
    const input = {
      name: "水",
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      cost: 0,
    };
    const result = mealItemFormSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});
