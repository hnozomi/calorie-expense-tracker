import { expect, test } from "@playwright/test";
import {
  clickToReveal,
  fillStable,
  gotoHydrated,
  openSlotDrawer,
} from "./helpers";

test.describe("献立カレンダー", () => {
  test("手動で献立を追加し、確認ダイアログ経由で削除できる", async ({
    page,
  }) => {
    await gotoHydrated(page, "/plan");
    await expect(page.getByText("今週")).toBeVisible();

    // Add a plan in the first breakfast cell
    await clickToReveal(
      page.getByRole("button", { name: "献立を追加" }).first(),
      page.getByText("献立のメニューを選択または入力してください"),
    );
    await fillStable(page, "メニュー名", "E2Eカレー");
    await fillStable(page, "カロリー (kcal)", "800");
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await expect(page.getByText("献立を保存しました")).toBeVisible();
    await expect(page.getByRole("button", { name: "E2Eカレー" })).toBeVisible();

    // Open the plan and delete it via the confirmation dialog
    await page.getByRole("button", { name: "E2Eカレー" }).click();
    await page.getByRole("button", { name: "この献立を削除する" }).click();
    await expect(page.getByText("献立を削除しますか？")).toBeVisible();
    await page.getByRole("button", { name: "削除する" }).click();
    await expect(page.getByText("献立を削除しました")).toBeVisible();
    await expect(page.getByRole("button", { name: "E2Eカレー" })).toHaveCount(
      0,
    );
  });

  test("食事記録を「実績を反映」で献立に取り込める", async ({ page }) => {
    // Seed: record yesterday's dinner via the home screen
    await gotoHydrated(page, "/home");
    // Move to yesterday
    await page.getByRole("button", { name: "前の日" }).click();
    await expect(page.getByText("今日へ")).toBeVisible();

    await openSlotDrawer(page, "夕食");
    await fillStable(page, "メニュー名", "E2E実績ラーメン");
    await fillStable(page, "カロリー (kcal)", "600");
    await page.getByRole("button", { name: "カードに追加" }).click();
    await page.getByRole("button", { name: "1件まとめて登録する" }).click();
    await expect(page.getByText("1件の食事を登録しました")).toBeVisible({
      timeout: 10_000,
    });

    // Sync actuals on the plan screen. On Mondays "yesterday" belongs to the
    // previous week, so move the calendar back one week first.
    await gotoHydrated(page, "/plan");
    await expect(page.getByText("週間サマリー")).toBeVisible();
    if (new Date().getDay() === 1) {
      await page.getByRole("button", { name: "前の週" }).click();
    }
    await page.getByRole("button", { name: "実績を反映" }).click();
    await expect(
      page.getByText("実際に食べた内容を献立に反映しますか？"),
    ).toBeVisible();
    await page.getByRole("button", { name: "反映する" }).click();
    await expect(
      page.getByText(/枠の献立を実際の食事内容で置き換えました/),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "E2E実績ラーメン" }),
    ).toBeVisible();
  });

  test("既存献立を編集してもPFCと参照が保持される", async ({ page }) => {
    await gotoHydrated(page, "/plan");
    await expect(page.getByText("週間サマリー")).toBeVisible();

    // Create a plan with a protein value via the manual tab
    await clickToReveal(
      page.getByRole("button", { name: "献立を追加" }).first(),
      page.getByText("献立のメニューを選択または入力してください"),
    );
    await fillStable(page, "メニュー名", "E2E編集前");
    await fillStable(page, "カロリー (kcal)", "800");
    await fillStable(page, "P (g)", "20");
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await expect(page.getByText("献立を保存しました")).toBeVisible();

    // Reopen and change only the name — regression guard for the bug where
    // saving via the manual tab silently zeroed PFC
    await clickToReveal(
      page.getByRole("button", { name: "E2E編集前" }),
      page.getByText("献立のメニューを選択または入力してください"),
    );
    await fillStable(page, "メニュー名", "E2E編集後");
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await expect(page.getByText("献立を保存しました")).toBeVisible();

    // Reopen: the protein value must still be 20
    await clickToReveal(
      page.getByRole("button", { name: "E2E編集後" }),
      page.getByText("献立のメニューを選択または入力してください"),
    );
    await expect(page.getByLabel("P (g)")).toHaveValue("20");

    // Clean up so later cases see an empty first breakfast cell
    await page.getByRole("button", { name: "この献立を削除する" }).click();
    await page.getByRole("button", { name: "削除する" }).click();
    await expect(page.getByText("献立を削除しました")).toBeVisible();
  });

  test("「今日の献立を転記」で献立が食事記録に反映される", async ({ page }) => {
    // Depends on meal-item.spec: 「献立に反映」 left an untransferred
    // E2Eポテチ plan in today's snack slot
    await gotoHydrated(page, "/plan");
    await expect(page.getByText("週間サマリー")).toBeVisible();

    await clickToReveal(
      page.getByRole("button", { name: "今日の献立を転記" }),
      page.getByText("今日の献立を食事記録に転記しました"),
    );

    await gotoHydrated(page, "/home");
    await expect(page.getByRole("button", { name: /E2Eポテチ/ })).toBeVisible();
  });
});
