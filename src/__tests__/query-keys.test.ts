import { describe, expect, it } from "vitest";
import { queryKeys } from "@/hooks/query-keys";

describe("queryKeys", () => {
  describe("meals", () => {
    it("has a stable all key", () => {
      expect(queryKeys.meals.all).toEqual(["meals"]);
    });

    it("generates daily keys with date", () => {
      expect(queryKeys.meals.daily("2026-03-21")).toEqual([
        "meals",
        "daily",
        "2026-03-21",
      ]);
    });

    it("generates summary keys with date", () => {
      expect(queryKeys.meals.summary("2026-03-21")).toEqual([
        "meals",
        "summary",
        "2026-03-21",
      ]);
    });
  });

  describe("recipes", () => {
    it("generates list keys with optional search", () => {
      expect(queryKeys.recipes.list()).toEqual(["recipes", "list", undefined]);
      expect(queryKeys.recipes.list("カレー")).toEqual([
        "recipes",
        "list",
        "カレー",
      ]);
    });

    it("generates detail keys with id", () => {
      expect(queryKeys.recipes.detail("abc")).toEqual([
        "recipes",
        "detail",
        "abc",
      ]);
    });
  });

  describe("setMenus", () => {
    it("generates list keys", () => {
      expect(queryKeys.setMenus.list()).toEqual(["set-menus", "list"]);
    });

    it("generates detail keys with id", () => {
      expect(queryKeys.setMenus.detail("xyz")).toEqual([
        "set-menus",
        "detail",
        "xyz",
      ]);
    });
  });

  describe("plans", () => {
    it("generates weekly keys with weekStart", () => {
      expect(queryKeys.plans.weekly("2026-03-16")).toEqual([
        "plans",
        "weekly",
        "2026-03-16",
      ]);
    });
  });

  describe("report", () => {
    it("generates weekly keys with weekStart", () => {
      expect(queryKeys.report.weekly("2026-03-16")).toEqual([
        "report",
        "weekly",
        "2026-03-16",
      ]);
    });
  });
});
