import { describe, expect, it } from "vitest";
import { matchesSearch } from "@/components/features/meals/utils/matches-search";

describe("matchesSearch", () => {
  it("S-02: an empty search matches everything", () => {
    expect(matchesSearch(["サラダチキン"], "")).toBe(true);
  });

  it("S-02: a search of only spaces matches everything", () => {
    expect(matchesSearch(["サラダチキン"], "   ")).toBe(true);
  });

  it("S-02: a part of the name matches", () => {
    expect(matchesSearch(["鶏むね肉のサラダ"], "むね肉")).toBe(true);
  });

  it("S-02: a word that is in none of the texts does not match", () => {
    expect(matchesSearch(["鶏むね肉のサラダ"], "カレー")).toBe(false);
  });

  it("S-02: spaces around the search words are ignored", () => {
    expect(matchesSearch(["鶏むね肉のサラダ"], "  サラダ ")).toBe(true);
  });

  it("S-02: letters match regardless of case", () => {
    expect(matchesSearch(["Greek Yogurt"], "greek")).toBe(true);
    expect(matchesSearch(["greek yogurt"], "YOGURT")).toBe(true);
  });

  it("S-08: a match in the second text (the brand) counts", () => {
    expect(matchesSearch(["サラダチキン", "セブンイレブン"], "セブン")).toBe(
      true,
    );
  });

  it("S-08: a missing brand (null or undefined) is skipped, not an error", () => {
    expect(matchesSearch(["おにぎり", null, undefined], "おにぎり")).toBe(true);
    expect(matchesSearch(["おにぎり", null, undefined], "セブン")).toBe(false);
  });

  it("S-02: with no texts at all, only an empty search matches", () => {
    expect(matchesSearch([], "")).toBe(true);
    expect(matchesSearch([], "a")).toBe(false);
  });
});
