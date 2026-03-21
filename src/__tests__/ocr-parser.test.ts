import { describe, expect, it } from "vitest";
import { parseNutritionText } from "@/components/features/ocr/utils/ocr-parser";

describe("parseNutritionText", () => {
  describe("calories extraction", () => {
    it("extracts calories with エネルギー label", () => {
      const result = parseNutritionText("エネルギー: 250kcal");
      expect(result.calories).toBe(250);
    });

    it("extracts calories with 熱量 label", () => {
      const result = parseNutritionText("熱量 120 kcal");
      expect(result.calories).toBe(120);
    });

    it("extracts calories with カロリー label", () => {
      const result = parseNutritionText("カロリー: 300キロカロリー");
      expect(result.calories).toBe(300);
    });

    it("extracts decimal calories", () => {
      const result = parseNutritionText("エネルギー: 123.5kcal");
      expect(result.calories).toBe(123.5);
    });

    it("extracts calories without label (kcal only)", () => {
      const result = parseNutritionText("100kcal");
      expect(result.calories).toBe(100);
    });
  });

  describe("protein extraction", () => {
    it("extracts protein with たんぱく質 label", () => {
      const result = parseNutritionText("たんぱく質: 20.5g");
      expect(result.protein).toBe(20.5);
    });

    it("extracts protein with タンパク質 label", () => {
      const result = parseNutritionText("タンパク質 15g");
      expect(result.protein).toBe(15);
    });

    it("extracts protein with English label", () => {
      const result = parseNutritionText("Protein: 10.2g");
      expect(result.protein).toBe(10.2);
    });
  });

  describe("fat extraction", () => {
    it("extracts fat with 脂質 label", () => {
      const result = parseNutritionText("脂質: 8.3g");
      expect(result.fat).toBe(8.3);
    });

    it("extracts fat with English label", () => {
      const result = parseNutritionText("Fat: 5g");
      expect(result.fat).toBe(5);
    });
  });

  describe("carbs extraction", () => {
    it("extracts carbs with 炭水化物 label", () => {
      const result = parseNutritionText("炭水化物: 30g");
      expect(result.carbs).toBe(30);
    });

    it("extracts carbs with 糖質 label", () => {
      const result = parseNutritionText("糖質: 25.5g");
      expect(result.carbs).toBe(25.5);
    });
  });

  describe("name extraction", () => {
    it("extracts name with 名称 label", () => {
      const result = parseNutritionText(
        "名称: サラダチキン, エネルギー: 100kcal",
      );
      expect(result.name).toBe("サラダチキン");
    });

    it("extracts name with 品名 label", () => {
      const result = parseNutritionText("品名: おにぎり（鮭）");
      expect(result.name).toBe("おにぎり（鮭）");
    });

    it("extracts name with 商品名 label", () => {
      const result = parseNutritionText("商品名: プロテインバー");
      expect(result.name).toBe("プロテインバー");
    });

    it("returns null when no name pattern matches", () => {
      const result = parseNutritionText("エネルギー: 100kcal");
      expect(result.name).toBeNull();
    });
  });

  describe("full-width normalization", () => {
    it("converts full-width numbers to half-width", () => {
      const result = parseNutritionText("エネルギー: ２５０kcal");
      expect(result.calories).toBe(250);
    });

    it("converts full-width decimal point", () => {
      const result = parseNutritionText("たんぱく質: １０．５g");
      expect(result.protein).toBe(10.5);
    });
  });

  describe("complete label parsing", () => {
    it("parses a full Japanese nutrition label with comma separation", () => {
      const label =
        "名称: サラダチキン（プレーン）, エネルギー: 110kcal, たんぱく質: 23.8g, 脂質: 1.2g, 炭水化物: 0.3g";
      const result = parseNutritionText(label);
      expect(result.name).toBe("サラダチキン（プレーン）");
      expect(result.calories).toBe(110);
      expect(result.protein).toBe(23.8);
      expect(result.fat).toBe(1.2);
      expect(result.carbs).toBe(0.3);
    });

    it("parses nutrition values even without name", () => {
      const label =
        "エネルギー: 200kcal たんぱく質: 15g 脂質: 8g 炭水化物: 20g";
      const result = parseNutritionText(label);
      expect(result.name).toBeNull();
      expect(result.calories).toBe(200);
      expect(result.protein).toBe(15);
      expect(result.fat).toBe(8);
      expect(result.carbs).toBe(20);
    });

    it("returns all nulls for unrecognized text", () => {
      const result = parseNutritionText("関係ないテキスト");
      expect(result.name).toBeNull();
      expect(result.calories).toBeNull();
      expect(result.protein).toBeNull();
      expect(result.fat).toBeNull();
      expect(result.carbs).toBeNull();
    });

    it("handles empty string", () => {
      const result = parseNutritionText("");
      expect(result.calories).toBeNull();
      expect(result.protein).toBeNull();
      expect(result.fat).toBeNull();
      expect(result.carbs).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("handles comma in numbers", () => {
      const result = parseNutritionText("エネルギー: 1,200kcal");
      expect(result.calories).toBe(1200);
    });

    it("extracts first match when multiple values exist", () => {
      const result = parseNutritionText("エネルギー: 100kcal 200kcal");
      expect(result.calories).toBe(100);
    });
  });
});
