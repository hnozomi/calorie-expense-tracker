import { expect, test } from "@playwright/test";
import { clickToReveal, fillStable, gotoHydrated } from "./helpers";

// SL-1: recipe with an ingredient -> plan it next week -> shopping list
// aggregates the ingredient per serving. Uses NEXT week so the grid is
// guaranteed empty regardless of what earlier specs planned this week.
test.describe("買い物リスト", () => {
  test("レシピ由来の献立の材料が人数割りで集計される", async ({ page }) => {
    // Create a recipe (2人分) with one ingredient
    await gotoHydrated(page, "/recipes/new");
    await fillStable(page, /レシピ名/, "E2E豚汁");
    await fillStable(page, /何人分/, "2");
    await fillStable(page, /カロリー/, "400");
    await page.getByRole("button", { name: "追加", exact: true }).click();
    await fillStable(page, "材料名", "E2E大根");
    await fillStable(page, "数量", "4");
    await fillStable(page, "単位", "本");
    await fillStable(page, /単価/, "200");
    await page.getByRole("button", { name: /登録する/ }).click();
    await expect(page.getByText("レシピを登録しました")).toBeVisible({
      timeout: 10_000,
    });

    // Plan it on next week's first empty cell (next week is always clean)
    await gotoHydrated(page, "/plan");
    await page.getByRole("button", { name: "次の週" }).click();
    await clickToReveal(
      page.getByRole("button", { name: "献立を追加" }).first(),
      page.getByRole("dialog"),
    );
    await page.getByRole("tab", { name: "レシピ" }).click();
    await clickToReveal(
      page.getByRole("dialog").getByRole("button", { name: /E2E豚汁/ }),
      page.getByRole("button", { name: /E2E豚汁/ }),
    );

    // Shopping list: 4本/2人分 -> 1人分は2本・¥100
    await clickToReveal(
      page.getByRole("button", { name: "買い物リスト" }),
      page.getByRole("dialog", { name: "買い物リスト" }),
    );
    const dialog = page.getByRole("dialog", { name: "買い物リスト" });
    await expect(dialog.getByText("E2E大根")).toBeVisible();
    await expect(dialog.getByText("2本")).toBeVisible();
    await expect(dialog.getByText("¥100")).toHaveCount(2); // 行 + 概算合計

    // Checking an item strikes it through
    await dialog.getByRole("checkbox", { name: /E2E大根/ }).check();
    await expect(dialog.getByText("E2E大根")).toHaveClass(/line-through/);
  });
});
