/** Parsed nutrition data from OCR text */
export type OcrNutritionResult = {
  name: string | null;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

/** Fix common OCR misreads in numeric contexts (O→0, l→1, etc.) */
const fixOcrDigits = (s: string): string =>
  s
    .replace(/[OoО]/g, "0")
    .replace(/[lIｌＩ]/g, "1")
    .replace(/[Ss]/g, "5");

/** Extract a numeric value following a label pattern */
const extractValue = (text: string, patterns: RegExp[]): number | null => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const cleaned = fixOcrDigits(match[1]).replace(",", "");
      const value = Number.parseFloat(cleaned);
      if (!Number.isNaN(value)) return value;
    }
  }
  return null;
};

/** Normalize OCR text for reliable pattern matching */
const normalizeText = (text: string): string =>
  text
    // Full-width digits → half-width
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    // Full-width punctuation → half-width
    .replace(/．/g, ".")
    .replace(/，/g, ",")
    // Full-width colon / space
    .replace(/：/g, ":")
    // Collapse whitespace but keep newlines for line-based matching
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");

/** Parse OCR text to extract nutrition information from Japanese food labels */
export const parseNutritionText = (text: string): OcrNutritionResult => {
  const normalized = normalizeText(text);

  // Also prepare a single-line version for fallback matching
  const flat = normalized.replace(/\n/g, " ");

  const calories = extractValue(flat, [
    /(?:エネルギー|熱量|カロリー|ｴﾈﾙｷﾞｰ)[:\s]*(\d+[.,]?\d*)\s*(?:kcal|Kcal|kca[l1]|キロカロリー)/i,
    /(?:エネルギー|熱量|カロリー|ｴﾈﾙｷﾞｰ)[:\s]*(\d+[.,]?\d*)/i,
    /(\d+[.,]?\d*)\s*(?:kcal|Kcal|kca[l1]|キロカロリー)/i,
  ]);

  const protein = extractValue(flat, [
    /(?:たんぱく質|蛋白質|タンパク質|たん白質|protein)[:\s]*(\d+[.,]?\d*)\s*g/i,
    /(?:たんぱく質|蛋白質|タンパク質|たん白質)[:\s]*(\d+[.,]?\d*)/i,
  ]);

  const fat = extractValue(flat, [
    /(?:脂質|脂肪|fat)[:\s]*(\d+[.,]?\d*)\s*g/i,
    /脂質[:\s]*(\d+[.,]?\d*)/i,
  ]);

  const carbs = extractValue(flat, [
    /(?:炭水化物|糖質|carbohydrate|carbs)[:\s]*(\d+[.,]?\d*)\s*g/i,
    /(?:炭水化物|糖質)[:\s]*(\d+[.,]?\d*)/i,
  ]);

  // Try to extract product name from common patterns
  const nameMatch = flat.match(/(?:名称|品名|商品名|品目)[:\s]*([^\n,、。]+)/);
  const name = nameMatch?.[1]?.trim() ?? null;

  return { name, calories, protein, fat, carbs };
};
