import { expect, test } from "@playwright/test";
import { fillStable, gotoHydrated, openSlotDrawer } from "./helpers";

test.describe("食事記録", () => {
  test("手動入力で朝食を登録するとサマリーに反映される", async ({ page }) => {
    await gotoHydrated(page, "/home");

    // Open the breakfast register drawer
    await openSlotDrawer(page, "朝食");

    // Fill the manual form and add to the card
    await fillStable(page, "メニュー名", "E2Eトースト");
    await fillStable(page, "カロリー (kcal)", "300");
    await fillStable(page, "P (g)", "10");
    await page.getByRole("button", { name: "カードに追加" }).click();

    // Footer summary shows the queued item
    await expect(page.getByText("直前: E2Eトースト")).toBeVisible();

    // Register and verify it lands in the breakfast slot
    await page.getByRole("button", { name: "1件まとめて登録する" }).click();
    await expect(page.getByText("1件の食事を登録しました")).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole("button", { name: /E2Eトースト/ }),
    ).toBeVisible();
  });

  test("カード未追加の入力があると登録時に確認が出て、追加して登録できる", async ({
    page,
  }) => {
    await gotoHydrated(page, "/home");

    // Add one item to the card for the lunch slot
    await openSlotDrawer(page, "昼食");
    await fillStable(page, "メニュー名", "E2Eそば");
    await fillStable(page, "カロリー (kcal)", "400");
    await page.getByRole("button", { name: "カードに追加" }).click();
    await expect(page.getByText("直前: E2Eそば")).toBeVisible();

    // Type a second item but do NOT add it to the card
    await fillStable(page, "メニュー名", "E2Eいなり");
    await fillStable(page, "カロリー (kcal)", "150");

    // Register: the pending-input dialog must appear
    await page.getByRole("button", { name: "1件まとめて登録する" }).click();
    await expect(page.getByText("入力中のアイテムがあります")).toBeVisible();
    await expect(page.getByText("「E2Eいなり」")).toBeVisible();

    // Include the typed item and register both
    await page.getByRole("button", { name: "追加して登録" }).click();
    await expect(page.getByText("2件の食事を登録しました")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("button", { name: /E2Eそば/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /E2Eいなり/ })).toBeVisible();
  });

  test("下書きが残った状態で閉じると破棄確認が出る", async ({ page }) => {
    await gotoHydrated(page, "/home");

    await openSlotDrawer(page, "夕食");
    await fillStable(page, "メニュー名", "E2E破棄テスト");
    await fillStable(page, "カロリー (kcal)", "100");
    await page.getByRole("button", { name: "カードに追加" }).click();
    await expect(page.getByText("直前: E2E破棄テスト")).toBeVisible();

    // Close the drawer via Escape → discard confirmation appears
    await page.keyboard.press("Escape");
    await expect(
      page.getByText("入力中のアイテムを破棄しますか?"),
    ).toBeVisible();
    await page.getByRole("button", { name: "破棄して閉じる" }).click();

    // The item was not registered
    await expect(
      page.getByRole("button", { name: /E2E破棄テスト/ }),
    ).toHaveCount(0);
  });
});
