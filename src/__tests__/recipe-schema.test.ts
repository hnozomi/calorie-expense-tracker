import { describe, expect, it } from "vitest";
import {
  ingredientSchema,
  recipeFormSchema,
} from "@/components/features/recipes/types/recipe";

describe("recipeFormSchema", () => {
  /** Build valid form data */
  const validData = {
    name: "鶏むね肉のサラダ",
    servings: 2,
    calories: 400,
    protein: 50,
    fat: 10,
    carbs: 20,
  };

  it("accepts valid minimal data", () => {
    const result = recipeFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts valid data with optional notes", () => {
    const result = recipeFormSchema.safeParse({
      ...validData,
      notes: "下味は塩コショウのみ",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = recipeFormSchema.safeParse({ ...validData, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const { name: _, ...rest } = validData;
    const result = recipeFormSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects servings less than 1", () => {
    const result = recipeFormSchema.safeParse({ ...validData, servings: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer servings", () => {
    const result = recipeFormSchema.safeParse({ ...validData, servings: 1.5 });
    expect(result.success).toBe(false);
  });

  it("accepts servings of 1", () => {
    const result = recipeFormSchema.safeParse({ ...validData, servings: 1 });
    expect(result.success).toBe(true);
  });

  it("rejects negative calories", () => {
    const result = recipeFormSchema.safeParse({
      ...validData,
      calories: -10,
    });
    expect(result.success).toBe(false);
  });

  it("accepts zero calories", () => {
    const result = recipeFormSchema.safeParse({ ...validData, calories: 0 });
    expect(result.success).toBe(true);
  });

  it("rejects negative protein", () => {
    const result = recipeFormSchema.safeParse({ ...validData, protein: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects negative fat", () => {
    const result = recipeFormSchema.safeParse({ ...validData, fat: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects negative carbs", () => {
    const result = recipeFormSchema.safeParse({ ...validData, carbs: -1 });
    expect(result.success).toBe(false);
  });

  it("coerces string numbers to numeric values", () => {
    const result = recipeFormSchema.safeParse({
      ...validData,
      calories: "200",
      protein: "25.5",
      fat: "8.3",
      carbs: "15",
      servings: "3",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.calories).toBe(200);
      expect(result.data.protein).toBe(25.5);
      expect(result.data.servings).toBe(3);
    }
  });

  it("accepts decimal nutrition values", () => {
    const result = recipeFormSchema.safeParse({
      ...validData,
      calories: 123.4,
      protein: 0.1,
      fat: 0.01,
      carbs: 99.99,
    });
    expect(result.success).toBe(true);
  });
});

describe("ingredientSchema", () => {
  const validIngredient = {
    ingredientName: "鶏むね肉",
    quantity: 200,
    unit: "g",
    unitPrice: 1.5,
  };

  it("accepts valid ingredient data", () => {
    const result = ingredientSchema.safeParse(validIngredient);
    expect(result.success).toBe(true);
  });

  it("accepts ingredient with optional id", () => {
    const result = ingredientSchema.safeParse({
      ...validIngredient,
      id: "ing-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty ingredient name", () => {
    const result = ingredientSchema.safeParse({
      ...validIngredient,
      ingredientName: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const result = ingredientSchema.safeParse({
      ...validIngredient,
      quantity: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts zero quantity", () => {
    const result = ingredientSchema.safeParse({
      ...validIngredient,
      quantity: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative unit price", () => {
    const result = ingredientSchema.safeParse({
      ...validIngredient,
      unitPrice: -10,
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty unit string", () => {
    const result = ingredientSchema.safeParse({
      ...validIngredient,
      unit: "",
    });
    expect(result.success).toBe(true);
  });

  it("coerces string numbers for quantity and unitPrice", () => {
    const result = ingredientSchema.safeParse({
      ...validIngredient,
      quantity: "300",
      unitPrice: "2.5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(300);
      expect(result.data.unitPrice).toBe(2.5);
    }
  });
});
