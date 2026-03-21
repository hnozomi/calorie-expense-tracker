/** Parsed nutrition data from OCR text */
export type OcrNutritionResult = {
  name: string | null;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

/** Extract a numeric value following a label pattern */
const extractValue = (text: string, patterns: RegExp[]): number | null => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = Number.parseFloat(match[1].replace(",", ""));
      if (!Number.isNaN(value)) return value;
    }
  }
  return null;
};

/** Parse OCR text to extract nutrition information from Japanese food labels */
export const parseNutritionText = (text: string): OcrNutritionResult => {
  // Normalize text: full-width to half-width numbers, remove extra whitespace
  const normalized = text
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/．/g, ".")
    .replace(/，/g, ",")
    .replace(/\s+/g, " ");

  const calories = extractValue(normalized, [
    /(?:エネルギー|熱量|カロリー)[:\s]*(\d+[.,]?\d*)\s*(?:kcal|キロカロリー)/i,
    /(\d+[.,]?\d*)\s*(?:kcal|キロカロリー)/i,
  ]);

  const protein = extractValue(normalized, [
    /(?:たんぱく質|蛋白質|タンパク質|protein)[:\s]*(\d+[.,]?\d*)\s*g/i,
    /(?:たんぱく質|タンパク質)[:\s]*(\d+[.,]?\d*)/i,
  ]);

  const fat = extractValue(normalized, [
    /(?:脂質|脂肪|fat)[:\s]*(\d+[.,]?\d*)\s*g/i,
    /脂質[:\s]*(\d+[.,]?\d*)/i,
  ]);

  const carbs = extractValue(normalized, [
    /(?:炭水化物|糖質|carbohydrate)[:\s]*(\d+[.,]?\d*)\s*g/i,
    /炭水化物[:\s]*(\d+[.,]?\d*)/i,
  ]);

  // Try to extract product name from first line or common patterns
  const nameMatch = normalized.match(/(?:名称|品名|商品名)[:\s]*([^\n,]+)/);
  const name = nameMatch?.[1]?.trim() ?? null;

  return { name, calories, protein, fat, carbs };
};
