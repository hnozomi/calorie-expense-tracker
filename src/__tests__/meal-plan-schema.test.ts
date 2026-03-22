import { describe, expect, it } from "vitest";
import { mealPlanFormSchema } from "@/components/features/plan/types/meal-plan";

describe("mealPlanFormSchema", () => {
  it("accepts valid meal plan form data", () => {
    const result = mealPlanFormSchema.safeParse({
      plannedName: "ご飯と味噌汁",
      calories: 500,
      protein: 15,
      fat: 10,
      carbs: 70,
      estimatedCost: 300,
    });
    expect(result.success).toBe(true);
  });

  it("accepts zero values for nutrition and cost", () => {
    const result = mealPlanFormSchema.safeParse({
      plannedName: "水",
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      estimatedCost: 0,
    });
    expect(result.success).toBe(true);
  });

  it("coerces string numbers to numbers", () => {
    const result = mealPlanFormSchema.safeParse({
      plannedName: "カレーライス",
      calories: "600",
      protein: "20",
      fat: "15",
      carbs: "80",
      estimatedCost: "450",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.calories).toBe(600);
      expect(result.data.estimatedCost).toBe(450);
    }
  });

  it("rejects empty plannedName", () => {
    const result = mealPlanFormSchema.safeParse({
      plannedName: "",
      calories: 500,
      protein: 15,
      fat: 10,
      carbs: 70,
      estimatedCost: 300,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative calories", () => {
    const result = mealPlanFormSchema.safeParse({
      plannedName: "テスト",
      calories: -100,
      protein: 15,
      fat: 10,
      carbs: 70,
      estimatedCost: 300,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative protein", () => {
    const result = mealPlanFormSchema.safeParse({
      plannedName: "テスト",
      calories: 500,
      protein: -5,
      fat: 10,
      carbs: 70,
      estimatedCost: 300,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative fat", () => {
    const result = mealPlanFormSchema.safeParse({
      plannedName: "テスト",
      calories: 500,
      protein: 15,
      fat: -10,
      carbs: 70,
      estimatedCost: 300,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative carbs", () => {
    const result = mealPlanFormSchema.safeParse({
      plannedName: "テスト",
      calories: 500,
      protein: 15,
      fat: 10,
      carbs: -70,
      estimatedCost: 300,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative estimatedCost", () => {
    const result = mealPlanFormSchema.safeParse({
      plannedName: "テスト",
      calories: 500,
      protein: 15,
      fat: 10,
      carbs: 70,
      estimatedCost: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing plannedName", () => {
    const result = mealPlanFormSchema.safeParse({
      calories: 500,
      protein: 15,
      fat: 10,
      carbs: 70,
      estimatedCost: 300,
    });
    expect(result.success).toBe(false);
  });

  it("accepts decimal values for nutrition", () => {
    const result = mealPlanFormSchema.safeParse({
      plannedName: "プロテインバー",
      calories: 250.5,
      protein: 20.3,
      fat: 8.7,
      carbs: 25.1,
      estimatedCost: 198,
    });
    expect(result.success).toBe(true);
  });
});
