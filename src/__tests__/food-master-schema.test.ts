import { describe, expect, it } from "vitest";
import { foodMasterFormSchema } from "@/components/features/food-masters/types/food-master";

describe("foodMasterFormSchema", () => {
  /** Build valid form data */
  const validData = {
    name: "サラダチキン",
    calories: 110,
    protein: 23.8,
    fat: 1.2,
    carbs: 0.3,
  };

  it("accepts valid minimal data", () => {
    const result = foodMasterFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts valid data with all optional fields", () => {
    const result = foodMasterFormSchema.safeParse({
      ...validData,
      brand: "セブンイレブン",
      category: "bento",
      defaultPrice: 250,
      notes: "高タンパク低脂質",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = foodMasterFormSchema.safeParse({
      ...validData,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative calories", () => {
    const result = foodMasterFormSchema.safeParse({
      ...validData,
      calories: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative protein", () => {
    const result = foodMasterFormSchema.safeParse({
      ...validData,
      protein: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative fat", () => {
    const result = foodMasterFormSchema.safeParse({
      ...validData,
      fat: -0.1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative carbs", () => {
    const result = foodMasterFormSchema.safeParse({
      ...validData,
      carbs: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative defaultPrice", () => {
    const result = foodMasterFormSchema.safeParse({
      ...validData,
      defaultPrice: -100,
    });
    expect(result.success).toBe(false);
  });

  it("accepts zero values for nutrition", () => {
    const result = foodMasterFormSchema.safeParse({
      name: "水",
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    });
    expect(result.success).toBe(true);
  });

  it("coerces string numbers to numbers", () => {
    const result = foodMasterFormSchema.safeParse({
      name: "テスト食品",
      calories: "100",
      protein: "10",
      fat: "5",
      carbs: "20",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.calories).toBe(100);
    }
  });

  it("accepts all valid category values", () => {
    const categories = [
      "bento",
      "bread",
      "side_dish",
      "snack",
      "drink",
      "ingredient",
      "other",
    ];
    for (const category of categories) {
      const result = foodMasterFormSchema.safeParse({
        ...validData,
        category,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid category value", () => {
    const result = foodMasterFormSchema.safeParse({
      ...validData,
      category: "invalid_cat",
    });
    expect(result.success).toBe(false);
  });

  it("allows optional fields to be omitted", () => {
    const result = foodMasterFormSchema.safeParse({
      name: "おにぎり",
      calories: 200,
      protein: 5,
      fat: 1,
      carbs: 40,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.brand).toBeUndefined();
      expect(result.data.category).toBeUndefined();
      expect(result.data.defaultPrice).toBeUndefined();
      expect(result.data.notes).toBeUndefined();
    }
  });
});
