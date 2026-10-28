import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readNutritionLabel } from "@/components/features/ocr/api/actions";
import type { OcrNutritionResult } from "@/components/features/ocr/types/ocr";

const parse = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { parse };
  },
}));

const rpc = vi.fn();
const getClaims = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc, auth: { getClaims } }),
}));

const JPEG_BASE64 = "/9j/4AAQSkZJRgABAQ==";
const JPEG_DATA_URL = `data:image/jpeg;base64,${JPEG_BASE64}`;

const labelResult: OcrNutritionResult = {
  name: "サラダチキン",
  calories: 110,
  protein: 23.8,
  fat: 1.2,
  carbs: null,
  pieceCount: null,
};

// What Claude returns for labelResult: the label values plus the two per-piece fields the action maps to pieceCount
const { pieceCount: _pieceCount, ...labelValues } = labelResult;
const parsedLabel = {
  ...labelValues,
  valuesArePerPiece: false,
  piecesInPackage: null,
};

beforeEach(() => {
  getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
  rpc.mockResolvedValue({ data: true, error: null });
  parse.mockResolvedValue({
    stop_reason: "end_turn",
    parsed_output: parsedLabel,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("readNutritionLabel (F-02 栄養表の読み取り)", () => {
  describe("入力の検証", () => {
    it.each([
      ["文字列でない値", 123],
      ["null", null],
      ["PNG の data URL", "data:image/png;base64,iVBORw0KGgo="],
      ["data URL でない文字列", "https://example.com/label.jpg"],
      ["base64 でない中身", "data:image/jpeg;base64,not base64!"],
    ])("F-02: %s は失敗を返し、回数も数えず Claude も呼ばない", async (_label, input) => {
      const result = await readNutritionLabel(input);

      expect(result).toEqual({ ok: false, reason: "failed" });
      expect(rpc).not.toHaveBeenCalled();
      expect(parse).not.toHaveBeenCalled();
    });
  });

  it("F-02: ログインしていなければ失敗を返し、回数も数えず Claude も呼ばない", async () => {
    getClaims.mockResolvedValue({ data: null });

    const result = await readNutritionLabel(JPEG_DATA_URL);

    expect(result).toEqual({ ok: false, reason: "failed" });
    expect(rpc).not.toHaveBeenCalled();
    expect(parse).not.toHaveBeenCalled();
  });

  describe("1日の回数上限", () => {
    it("F-02: 上限の20回で今日の回数を取る", async () => {
      await readNutritionLabel(JPEG_DATA_URL);

      expect(rpc).toHaveBeenCalledTimes(1);
      expect(rpc).toHaveBeenCalledWith("claim_ocr_scan", { p_daily_limit: 20 });
    });

    it("F-02: 今日の回数が残っていなければ上限を返し、Claude を呼ばない", async () => {
      rpc.mockResolvedValue({ data: false, error: null });

      const result = await readNutritionLabel(JPEG_DATA_URL);

      expect(result).toEqual({ ok: false, reason: "limit" });
      expect(parse).not.toHaveBeenCalled();
    });

    it("F-02: 回数を取れなかったら失敗を返し、Claude を呼ばない", async () => {
      rpc.mockResolvedValue({
        data: null,
        error: { message: "connection refused" },
      });

      const result = await readNutritionLabel(JPEG_DATA_URL);

      expect(result).toEqual({ ok: false, reason: "failed" });
      expect(parse).not.toHaveBeenCalled();
    });
  });

  describe("Claude での読み取り", () => {
    it("F-02: 回数が取れたら Claude が読んだ値を結果として返す", async () => {
      const result = await readNutritionLabel(JPEG_DATA_URL);

      expect(result).toEqual({ ok: true, result: labelResult });
      expect(parse).toHaveBeenCalledTimes(1);
    });

    it("F-02: Claude Haiku 5.5 に写真を base64 の JPEG として送る", async () => {
      await readNutritionLabel(JPEG_DATA_URL);

      const request = parse.mock.calls[0][0];
      expect(request.model).toBe("claude-haiku-5-5");
      expect(request.messages).toHaveLength(1);
      expect(request.messages[0].role).toBe("user");
      expect(request.messages[0].content).toContainEqual({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: JPEG_BASE64 },
      });
    });

    it("F-02: Claude の呼び出しが例外を投げたら失敗を返す", async () => {
      parse.mockRejectedValue(new Error("overloaded"));

      const result = await readNutritionLabel(JPEG_DATA_URL);

      expect(result).toEqual({ ok: false, reason: "failed" });
    });

    it.each([
      "max_tokens",
      "refusal",
    ])("F-02: 応答が end_turn 以外(%s)で終わったら失敗を返す", async (stopReason) => {
      parse.mockResolvedValue({
        stop_reason: stopReason,
        parsed_output: parsedLabel,
      });

      const result = await readNutritionLabel(JPEG_DATA_URL);

      expect(result).toEqual({ ok: false, reason: "failed" });
    });
  });

  describe("1個当たりの表示(何個入り)", () => {
    it("F-02: 1個当たりかと何個入りかを Claude に答えさせる", async () => {
      await readNutritionLabel(JPEG_DATA_URL);

      const request = parse.mock.calls[0][0];
      const schema = request.output_config.format.schema;
      expect(schema.properties).toHaveProperty("valuesArePerPiece");
      expect(schema.properties).toHaveProperty("piecesInPackage");
      expect(schema.required).toEqual(
        expect.arrayContaining(["valuesArePerPiece", "piecesInPackage"]),
      );
    });

    it("F-02: 1個当たりで8個入りなら pieceCount は 8", async () => {
      parse.mockResolvedValue({
        stop_reason: "end_turn",
        parsed_output: {
          ...parsedLabel,
          valuesArePerPiece: true,
          piecesInPackage: 8,
        },
      });

      const result = await readNutritionLabel(JPEG_DATA_URL);

      expect(result).toEqual({
        ok: true,
        result: { ...labelResult, pieceCount: 8 },
      });
    });

    it.each([
      ["1個入り", 1],
      ["個数が読めない", null],
    ])("F-02: 1個当たりでも%sなら pieceCount は null", async (_label, pieces) => {
      parse.mockResolvedValue({
        stop_reason: "end_turn",
        parsed_output: {
          ...parsedLabel,
          valuesArePerPiece: true,
          piecesInPackage: pieces,
        },
      });

      const result = await readNutritionLabel(JPEG_DATA_URL);

      expect(result).toEqual({
        ok: true,
        result: { ...labelResult, pieceCount: null },
      });
    });

    it("F-02: 値がパッケージ全体のものなら、8個入りでも pieceCount は null", async () => {
      parse.mockResolvedValue({
        stop_reason: "end_turn",
        parsed_output: {
          ...parsedLabel,
          valuesArePerPiece: false,
          piecesInPackage: 8,
        },
      });

      const result = await readNutritionLabel(JPEG_DATA_URL);

      expect(result).toEqual({
        ok: true,
        result: { ...labelResult, pieceCount: null },
      });
    });

    it("F-02: Claude に答えさせた valuesArePerPiece と piecesInPackage は結果に含めない", async () => {
      parse.mockResolvedValue({
        stop_reason: "end_turn",
        parsed_output: {
          ...parsedLabel,
          valuesArePerPiece: true,
          piecesInPackage: 8,
        },
      });

      const result = await readNutritionLabel(JPEG_DATA_URL);

      if (!result.ok) throw new Error("expected a successful read");
      expect(result.result).not.toHaveProperty("valuesArePerPiece");
      expect(result.result).not.toHaveProperty("piecesInPackage");
    });
  });
});
