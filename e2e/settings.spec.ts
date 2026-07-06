import { expect, test } from "@playwright/test";
import { fillStable, gotoHydrated } from "./helpers";

// Runs last alphabetically — the logout case invalidates the session.
// Note: user_settings has no DELETE RLS policy, so the setup wipe cannot
// reset it; these tests must not assume a default value.
test.describe("設定", () => {
  test("栄養目標に不正値を入れるとエラーになり保存されない", async ({
    page,
  }) => {
    await gotoHydrated(page, "/other/settings");
    const caloriesField = page.getByLabel("カロリー (kcal)");
    const initialValue = await caloriesField.inputValue();

    await fillStable(page, "カロリー (kcal)", "-100");
    await page.getByRole("button", { name: "保存" }).click();
    await expect(page.getByText("1以上で入力してください")).toBeVisible();

    // The invalid value was not persisted
    await gotoHydrated(page, "/other/settings");
    await expect(page.getByLabel("カロリー (kcal)")).toHaveValue(initialValue);
  });

  test("栄養目標を保存すると再読込後も維持される", async ({ page }) => {
    await gotoHydrated(page, "/other/settings");

    await fillStable(page, "カロリー (kcal)", "1800");
    await page.getByRole("button", { name: "保存" }).click();
    await expect(page.getByText("目標値を保存しました")).toBeVisible();

    await gotoHydrated(page, "/other/settings");
    await expect(page.getByLabel("カロリー (kcal)")).toHaveValue("1800");

    // Restore the default so reruns and other cases start from a known state
    await fillStable(page, "カロリー (kcal)", "2000");
    await page.getByRole("button", { name: "保存" }).click();
    await expect(page.getByText("目標値を保存しました").last()).toBeVisible();
  });

  test("ログアウトすると保護ページに戻れない", async ({ page }) => {
    await gotoHydrated(page, "/other/settings");

    await page.getByRole("button", { name: "ログアウト" }).click();
    await expect(page.getByText("ログアウトしますか？")).toBeVisible();
    // The dialog action shares its label with the trigger, so scope to the dialog
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "ログアウト" })
      .click();

    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    // Protected routes now redirect back to login
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login/);
  });
});
