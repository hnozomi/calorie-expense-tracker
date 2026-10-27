import { describe, expect, it } from "vitest";
import { parsePrefillParams } from "@/components/features/food-masters/utils/parse-prefill";

const parse = (query: string) => parsePrefillParams(new URLSearchParams(query));

describe("parsePrefillParams (S-08a OCR からの値の引き継ぎ)", () => {
  it("S-08a: 何も渡されなければ、何も入れない", () => {
    expect(parse("")).toEqual({});
  });

  it("S-08a: OCR で読んだ名前・カロリー・PFC・価格を引き継ぐ", () => {
    expect(
      parse(
        "name=プロテインバー&calories=200&protein=15.5&fat=8&carbs=20&defaultPrice=150",
      ),
    ).toEqual({
      name: "プロテインバー",
      calories: 200,
      protein: 15.5,
      fat: 8,
      carbs: 20,
      defaultPrice: 150,
    });
  });

  it("S-08a: 読めた値だけを引き継ぎ、無い値は入れない", () => {
    expect(parse("calories=120")).toEqual({ calories: 120 });
  });

  it("S-08a: 0 は値として引き継ぐ", () => {
    expect(parse("fat=0")).toEqual({ fat: 0 });
  });

  it.each([
    ["数でない値", "calories=abc"],
    ["マイナスの値", "protein=-1"],
  ])("02 バリデーション: %s は入れない(フォームで弾かれる値を入れておかない)", (_, query) => {
    expect(parse(query)).toEqual({});
  });

  it("S-08a: 空の名前は入れない", () => {
    expect(parse("name=")).toEqual({});
  });

  it("S-08a: 入力欄に無い値(ブランドなど)は引き継がない", () => {
    expect(parse("name=卵&unknown=1")).toEqual({ name: "卵" });
  });
});
