import { expect, test } from "@playwright/test";
import { clickToReveal, fillStable, gotoHydrated } from "./helpers";

test.describe("ナビゲーション", () => {
  test("ボトムナビで各タブへ遷移できる", async ({ page }) => {
    await gotoHydrated(page, "/home");

    await page.getByRole("link", { name: "献立" }).click();
    await expect(
      page.getByRole("heading", { name: "献立カレンダー" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "レシピ" }).click();
    await expect(
      page.getByRole("heading", { name: "レシピ", exact: true }),
    ).toBeVisible();

    await page.getByRole("link", { name: "その他" }).click();
    await expect(page.getByRole("link", { name: /設定/ })).toBeVisible();

    await page.getByRole("link", { name: "ホーム" }).click();
    await expect(page.getByText("朝食")).toBeVisible();
  });

  test("レシピを登録して一覧と編集画面に反映される", async ({ page }) => {
    await gotoHydrated(page, "/recipes");
    await clickToReveal(
      page.getByRole("link", { name: "レシピを登録", exact: true }),
      page.getByRole("heading", { name: "レシピを登録" }),
    );
    await page.waitForLoadState("networkidle");

    await fillStable(page, /レシピ名/, "E2E肉じゃが");
    await fillStable(page, /カロリー/, "500");
    await page.getByRole("button", { name: /登録する/ }).click();
    await expect(page.getByText("レシピを登録しました")).toBeVisible();

    // The new recipe appears in the list; opening it prefills the edit form
    const card = page.getByRole("link", { name: /E2E肉じゃが/ });
    await expect(card).toBeVisible();
    await card.click();
    await expect(page.getByLabel(/レシピ名/)).toHaveValue("E2E肉じゃが");
  });
});
