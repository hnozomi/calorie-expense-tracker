import { expect, test } from "@playwright/test";
import { clickToReveal, gotoHydrated, openSlotDrawer } from "./helpers";

// Runs after meal-*/plan specs (alphabetical order):
// - today's dinner slot is still empty (M-3 discarded its draft)
// - yesterday's dinner has E2E実績ラーメン (recorded by P-2)
// - today's lunch has E2Eそば (registered by M-2)
test.describe("クイック追加", () => {
  test("空きスロットで「前日をコピー」すると前日の内容が入る", async ({
    page,
  }) => {
    await gotoHydrated(page, "/home");

    // Today's dinner is empty and shows the copy button
    await clickToReveal(
      page.getByRole("button", { name: "前日をコピー" }).first(),
      page.getByText(/前日の夕食.*をコピーしました/),
    );

    await expect(
      page.getByRole("button", { name: /E2E実績ラーメン/ }),
    ).toBeVisible();
  });

  test("履歴タブから過去のアイテムをワンタップで再登録できる", async ({
    page,
  }) => {
    await gotoHydrated(page, "/home");

    // Open the drawer for the breakfast slot
    await openSlotDrawer(page, "朝食");

    // History tab lists previously registered items.
    // Scope to the dialog: the lunch slot behind it has the same item name.
    await page.getByRole("tab", { name: "履歴" }).click();
    await clickToReveal(
      page.getByRole("dialog").getByRole("button", { name: /E2Eそば/ }),
      page.getByText("直前: E2Eそば"),
    );

    await page.getByRole("button", { name: "1件まとめて登録する" }).click();
    await expect(page.getByText("1件の食事を登録しました")).toBeVisible({
      timeout: 10_000,
    });

    // Now present in breakfast as well as the original lunch slot
    await expect(page.getByRole("button", { name: /E2Eそば/ })).toHaveCount(2);
  });
});
