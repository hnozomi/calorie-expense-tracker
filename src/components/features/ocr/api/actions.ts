"use server";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod/v4";
import type {
  OcrNutritionResult,
  OcrReadResult,
} from "@/components/features/ocr/types/ocr";
import { createClient } from "@/lib/supabase/server";
import { getSignedInUserId } from "@/lib/supabase/user";

// Each scan is a billed Claude API call, so a user is stopped here before the call once the day's count is used up
const OCR_DAILY_LIMIT = 20;

const OCR_MODEL = "claude-haiku-5-5";

// A 1568px JPEG is well under 2MB; anything larger was not produced by resizeImageToDataUrl
const MAX_IMAGE_DATA_URL_LENGTH = 4_000_000;
const JPEG_DATA_URL_PREFIX = "data:image/jpeg;base64,";

const imageDataUrlSchema = z
  .string()
  .max(MAX_IMAGE_DATA_URL_LENGTH)
  .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/);

const nutritionLabelSchema = z.object({
  name: z.string().nullable(),
  calories: z.number().nullable(),
  protein: z.number().nullable(),
  fat: z.number().nullable(),
  carbs: z.number().nullable(),
});

const PROMPT = `This photo shows a Japanese food package, price sticker, or nutrition facts label.
Read the product name and the nutrition values exactly as printed.
- name: the product name (e.g. the large title line on a price sticker), not the manufacturer or store.
- calories: energy in kcal (熱量 / エネルギー).
- protein: たんぱく質 / 蛋白質 in grams.
- fat: 脂質 in grams.
- carbs: 炭水化物 in grams. If only 糖質 and 食物繊維 are shown, add them; if only 糖質 is shown, use it.
Use the values as printed for the unit the label states; do not multiply them.
Use null for anything not shown or not legible. Do not guess.`;

const readLabel = async (
  imageDataUrl: string,
): Promise<OcrNutritionResult | null> => {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: OCR_MODEL,
    max_tokens: 4096,
    output_config: {
      effort: "medium",
      format: zodOutputFormat(nutritionLabelSchema),
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageDataUrl.slice(JPEG_DATA_URL_PREFIX.length),
            },
          },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  });

  if (response.stop_reason !== "end_turn") return null;
  return response.parsed_output;
};

/** Read the nutrition values from a photo with Claude, within the user's daily scan limit */
export const readNutritionLabel = async (
  imageDataUrl: unknown,
): Promise<OcrReadResult> => {
  const parsed = imageDataUrlSchema.safeParse(imageDataUrl);
  if (!parsed.success) return { ok: false, reason: "failed" };

  const supabase = await createClient();
  const userId = await getSignedInUserId(supabase);
  if (!userId) return { ok: false, reason: "failed" };

  const { data: claimed, error } = await supabase.rpc("claim_ocr_scan", {
    p_daily_limit: OCR_DAILY_LIMIT,
  });
  if (error || typeof claimed !== "boolean") {
    return { ok: false, reason: "failed" };
  }
  if (!claimed) return { ok: false, reason: "limit" };

  try {
    const result = await readLabel(parsed.data);
    return result ? { ok: true, result } : { ok: false, reason: "failed" };
  } catch {
    return { ok: false, reason: "failed" };
  }
};
