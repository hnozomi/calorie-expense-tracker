import { expect, test } from "@playwright/test";
import { fillStable, gotoHydrated } from "./helpers";

// Auth failure paths need a signed-out context
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("認証", () => {
  test("未認証でホームにアクセスするとログインへリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login/);
  });

  test("誤ったパスワードでエラーメッセージが表示される", async ({ page }) => {
    await gotoHydrated(page, "/login");
    // Retried as a unit: pre-hydration input never reaches react-hook-form
    await expect(async () => {
      await fillStable(page, "メールアドレス", process.env.E2E_EMAIL!);
      await fillStable(page, "パスワード", "wrong-password-123", {
        exact: true,
      });
      await page.getByRole("button", { name: "ログイン" }).click();
      // Repeated E2E runs can hit the auth rate limit, which has its own message
      await expect(
        page.getByText(/正しくありません|試行回数が多すぎます/),
      ).toBeVisible({ timeout: 8_000 });
    }).toPass({ timeout: 40_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("存在しないページで日本語の404が表示される", async ({ page }) => {
    await page.goto("/no-such-page");
    await expect(page.getByText("ページが見つかりません")).toBeVisible();
  });
});
