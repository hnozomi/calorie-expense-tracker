import { expect, type Locator, type Page } from "@playwright/test";

/** Navigate and wait for the network to go idle, which on this app means the
 *  JS chunks have loaded and React has hydrated — clicks and fills before
 *  hydration are silently lost */
export const gotoHydrated = async (page: Page, path: string) => {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
};

/** Click a trigger until its expected result appears — guards against clicks
 *  landing before event handlers are attached */
export const clickToReveal = async (trigger: Locator, target: Locator) => {
  await expect(async () => {
    await trigger.click();
    await expect(target).toBeVisible({ timeout: 1_500 });
  }).toPass({ timeout: 20_000 });
};

/** Open the register drawer for a specific meal slot by its label.
 *  Slot-scoped (via the slot's aria-label region), so it works whether the
 *  slot is empty (登録する) or already has items (追加する) — which also
 *  keeps tests idempotent under retry. */
export const openSlotDrawer = async (
  page: Page,
  slotLabel: "朝食" | "昼食" | "夕食" | "間食",
) => {
  const slot = page.getByRole("region", { name: `${slotLabel}の記録` });
  await clickToReveal(
    slot.getByRole("button", { name: /登録する|追加する/ }),
    page.getByRole("dialog", { name: `${slotLabel}を登録` }),
  );
};

/** Fill an input and retry until the value sticks — React hydration can
 *  wipe values typed before the page becomes interactive */
export const fillStable = async (
  page: Page,
  label: string | RegExp,
  value: string,
  options?: { exact?: boolean },
) => {
  const field = page.getByLabel(label, { exact: options?.exact });
  await expect(async () => {
    await field.fill(value);
    await expect(field).toHaveValue(value, { timeout: 500 });
  }).toPass({ timeout: 15_000 });
};

/** Log in through the UI and land on /home. Values typed before hydration
 *  never reach react-hook-form state, so the whole fill+submit is retried
 *  until the navigation succeeds. */
export const loginViaUi = async (page: Page) => {
  await gotoHydrated(page, "/login");
  await expect(async () => {
    await fillStable(page, "メールアドレス", process.env.E2E_EMAIL!);
    await fillStable(page, "パスワード", process.env.E2E_PASSWORD!, {
      exact: true,
    });
    await page.getByRole("button", { name: "ログイン" }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10_000 });
  }).toPass({ timeout: 45_000 });
};
