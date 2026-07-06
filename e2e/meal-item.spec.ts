import { expect, test } from "@playwright/test";
import {
  clickToReveal,
  fillStable,
  gotoHydrated,
  openSlotDrawer,
} from "./helpers";

// Uses only the 間食 slot so meal-registration.spec's first()-based
// slot assumptions (朝食→昼食→夕食) stay valid.
test.describe("食事アイテムの編集・削除", () => {
  test("登録したアイテムを編集するとカロリーが更新される", async ({ page }) => {
    await gotoHydrated(page, "/home");

    // Register a snack item
    await openSlotDrawer(page, "間食");
    await fillStable(page, "メニュー名", "E2Eポテチ");
    await fillStable(page, "カロリー (kcal)", "200");
    await page.getByRole("button", { name: "カードに追加" }).click();
    await page.getByRole("button", { name: "1件まとめて登録する" }).click();
    await expect(page.getByText("1件の食事を登録しました")).toBeVisible({
      timeout: 10_000,
    });

    // Open the edit modal and change the calories
    await clickToReveal(
      page.getByRole("button", { name: /E2Eポテチ/ }),
      page.getByRole("dialog", { name: "アイテム編集" }),
    );
    await fillStable(page, "カロリー (kcal)", "250");
    await page.getByRole("button", { name: "変更を保存" }).click();
    await expect(page.getByText("変更を保存しました")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /E2Eポテチ.*250 kcal/ }),
    ).toBeVisible();
  });

  test("「献立に反映」でアイテムが献立カレンダーに転記される", async ({
    page,
  }) => {
    await gotoHydrated(page, "/home");

    // The snack slot from the previous test has the calendar-transfer button
    await clickToReveal(
      page.getByRole("button", { name: "献立に反映" }),
      page.getByText("献立に反映しますか？"),
    );
    await page.getByRole("button", { name: "反映する" }).click();
    await expect(page.getByText("献立に反映しました")).toBeVisible();

    await gotoHydrated(page, "/plan");
    await expect(page.getByRole("button", { name: "E2Eポテチ" })).toBeVisible();
  });

  test("アイテムをインライン確認経由で削除できる", async ({ page }) => {
    await gotoHydrated(page, "/home");

    await clickToReveal(
      page.getByRole("button", { name: /E2Eポテチ/ }),
      page.getByRole("dialog", { name: "アイテム編集" }),
    );
    await page.getByRole("button", { name: "このアイテムを削除する" }).click();
    await expect(page.getByText("「E2Eポテチ」を削除しますか？")).toBeVisible();
    await page.getByRole("button", { name: "削除する" }).click();
    await expect(page.getByText("削除しました")).toBeVisible();
    await expect(page.getByRole("button", { name: /E2Eポテチ/ })).toHaveCount(
      0,
    );
  });
});
