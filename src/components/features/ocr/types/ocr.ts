/** Nutrition values read from a photo; null where the label did not show the value */
export type OcrNutritionResult = {
  name: string | null;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  // When a label gives values for one piece of a multi-piece pack (1個当たり, 8個入り), the number of pieces.
  // null when the values cover the whole pack or the label does not say how many pieces there are
  pieceCount: number | null;
};

/** Why a scan did not produce a result: the daily limit was reached, or the read itself failed */
export type OcrFailureReason = "limit" | "failed";

export type OcrReadResult =
  | { ok: true; result: OcrNutritionResult }
  | { ok: false; reason: OcrFailureReason };
