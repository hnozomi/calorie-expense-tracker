import { expect, test as setup } from "@playwright/test";
import { loginViaUi, visibleText } from "./helpers";

setup("authenticate", async ({ page }) => {
  await loginViaUi(page);
  await expect(visibleText(page, "朝食")).toBeVisible();

  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
