import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { gotoHydrated } from "./helpers";

// Each main screen against WCAG 2.2 AA. Only serious and critical issues fail, so minor best-practice notes
// do not block a change
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const seriousViolations = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();
  return violations
    .filter(({ impact }) => impact === "serious" || impact === "critical")
    .map(({ id, help, nodes }) => ({
      id,
      help,
      targets: nodes.map(({ target }) => target.join(" ")),
    }));
};

// The edit screens take an id; seed.sql has no recipes or masters, so the new-item form stands for them
const screens = [
  "/home",
  "/plan",
  "/recipes",
  "/recipes/new",
  "/other",
  "/other/report",
  "/other/food-masters",
  "/other/food-masters/new",
  "/other/set-menus",
  "/other/set-menus/new",
  "/other/settings",
];

for (const path of screens) {
  test(`アクセシビリティ: ${path} に重大な問題が無い`, async ({ page }) => {
    await gotoHydrated(page, path);
    expect(await seriousViolations(page)).toEqual([]);
  });
}

test.describe("ログインしていないとき", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("アクセシビリティ: /login に重大な問題が無い", async ({ page }) => {
    await gotoHydrated(page, "/login");
    expect(await seriousViolations(page)).toEqual([]);
  });
});
