import { expect, test } from "@playwright/test";
import { fillStable, gotoHydrated, visibleField, visibleText } from "./helpers";
import { e2eUser, serviceRoleRest, userIdOf } from "./local-supabase";

// Runs last alphabetically — the logout case invalidates the session.
// Note: user_settings has no DELETE RLS policy, so the setup wipe cannot
// reset it; these tests must not assume a default value.
test.describe("設定", () => {
  test("AC-R-1(ST-1): 栄養目標に不正値を入れるとエラーになり保存されない", async ({
    page,
  }) => {
    await gotoHydrated(page, "/other/settings");
    const caloriesField = visibleField(page, "カロリー (kcal)");
    const initialValue = await caloriesField.inputValue();

    await fillStable(page, "カロリー (kcal)", "-100");
    await page.getByRole("button", { name: "保存" }).click();
    await expect(visibleText(page, "1以上で入力してください")).toBeVisible();

    // The invalid value was not persisted
    await gotoHydrated(page, "/other/settings");
    await expect(visibleField(page, "カロリー (kcal)")).toHaveValue(
      initialValue,
    );
  });

  test("AC-R-1(ST-2): 栄養目標を保存すると再読込後も維持される", async ({
    page,
  }) => {
    await gotoHydrated(page, "/other/settings");

    await fillStable(page, "カロリー (kcal)", "1800");
    await page.getByRole("button", { name: "保存" }).click();
    await expect(visibleText(page, "目標値を保存しました")).toBeVisible();

    await gotoHydrated(page, "/other/settings");
    await expect(visibleField(page, "カロリー (kcal)")).toHaveValue("1800");

    // Restore the default so reruns and other cases start from a known state
    await fillStable(page, "カロリー (kcal)", "2000");
    await page.getByRole("button", { name: "保存" }).click();
    await expect(
      visibleText(page, "目標値を保存しました").last(),
    ).toBeVisible();
  });

  // Phase 5 (ui-tech §10): the target is saved with a Server Action that re-reads every screen (AC-R-6)
  test.describe("目標を変えるとホームが変わる", () => {
    let savedRow: { target_calories: number } | undefined;

    test.beforeEach(async ({ page }, testInfo) => {
      // A cache of this test's own (see food-masters.spec.ts): the settings row is put back straight in the DB afterwards
      await page.setExtraHTTPHeaders({ "x-e2e-test-id": testInfo.testId });
      const userId = await userIdOf(e2eUser.email);
      [savedRow] = (await (
        await serviceRoleRest(
          `user_settings?user_id=eq.${userId}&select=target_calories`,
        )
      ).json()) as { target_calories: number }[];
    });

    test.afterEach(async () => {
      const userId = await userIdOf(e2eUser.email);
      await serviceRoleRest(
        `user_settings?user_id=eq.${userId}`,
        savedRow
          ? {
              method: "PATCH",
              body: JSON.stringify({
                target_calories: savedRow.target_calories,
              }),
            }
          : { method: "DELETE" },
      );
    });

    test("AC-R-6: 目標カロリーを変えてからホームに移ると、集計の目標(あと何 kcal)が変わっている", async ({
      page,
    }) => {
      const remaining = () => visibleText(page, /^あと\s*\d+\s*kcal$/);
      const remainingKcal = async () =>
        Number((await remaining().textContent())?.replace(/\D/g, ""));

      await gotoHydrated(page, "/home");
      const before = await remainingKcal();
      // With today's meals over the target the remainder is clamped at 0 and would not show the change
      expect(before).toBeGreaterThan(0);

      await page.getByRole("link", { name: "その他" }).click();
      await page.getByRole("link", { name: /設定/ }).click();
      const caloriesField = visibleField(page, "カロリー (kcal)");
      await expect(caloriesField).toBeVisible();
      await page.waitForLoadState("networkidle");
      const target = Number(await caloriesField.inputValue());

      await fillStable(page, "カロリー (kcal)", String(target + 1000));
      await page.getByRole("button", { name: "保存" }).click();
      await expect(visibleText(page, "目標値を保存しました")).toBeVisible();

      await page.getByRole("link", { name: "ホーム" }).click();

      await expect(page).toHaveURL(/\/home$/);
      await expect(remaining()).toHaveText(
        new RegExp(`^あと\\s*${before + 1000}\\s*kcal$`),
      );
    });
  });

  test("AC-R-1(ST-3): ログアウトすると保護ページに戻れない", async ({
    page,
  }) => {
    await gotoHydrated(page, "/other/settings");

    await page.getByRole("button", { name: "ログアウト" }).click();
    await expect(visibleText(page, "ログアウトしますか？")).toBeVisible();
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
