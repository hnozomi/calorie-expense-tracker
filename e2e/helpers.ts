import { expect, type Locator, type Page } from "@playwright/test";
import { e2eUser } from "./local-supabase";

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

/** Text on the screen being shown. With cacheComponents, screens visited
 *  earlier stay in the DOM hidden (display: none), so a plain getByText can
 *  match the same words on a hidden screen and fail on strict mode */
export const visibleText = (
  scope: Page | Locator,
  text: string | RegExp,
  options?: { exact?: boolean },
): Locator => scope.getByText(text, options).filter({ visible: true });

/** Field on the screen being shown, by its label. Hidden screens keep their
 *  forms, so the same label (カロリー (kcal) etc.) can exist twice */
export const visibleField = (
  page: Page,
  label: string | RegExp,
  options?: { exact?: boolean },
): Locator => page.getByLabel(label, options).filter({ visible: true });

/** Fill an input and retry until the value sticks — React hydration can
 *  wipe values typed before the page becomes interactive */
export const fillStable = async (
  page: Page,
  label: string | RegExp,
  value: string,
  options?: { exact?: boolean },
) => {
  const field = visibleField(page, label, { exact: options?.exact });
  await expect(async () => {
    await field.fill(value);
    await expect(field).toHaveValue(value, { timeout: 500 });
  }).toPass({ timeout: 15_000 });
};

/** Log in through the UI and land on /home. Values typed before hydration
 *  never reach react-hook-form state, so the whole fill+submit is retried
 *  until the navigation succeeds. `navigate: false` uses the login screen
 *  already shown (after a logout) instead of loading /login again. */
export const loginViaUi = async (
  page: Page,
  user: { email: string; password: string } = e2eUser,
  options: { navigate?: boolean } = {},
) => {
  if (options.navigate ?? true) {
    await gotoHydrated(page, "/login");
  } else {
    await expect(page).toHaveURL(/\/login/);
    await page.waitForLoadState("networkidle");
  }
  await expect(async () => {
    await fillStable(page, "メールアドレス", user.email);
    await fillStable(page, "パスワード", user.password, {
      exact: true,
    });
    await page.getByRole("button", { name: "ログイン" }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 10_000 });
  }).toPass({ timeout: 45_000 });
};

/** The server decides today in Asia/Tokyo (getTodayInTokyo), so the tests do the same */
export const todayInTokyo = (): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(
    new Date(),
  );

/** Monday = 1 ... Sunday = 7 for a YYYY-MM-DD day */
export const isoWeekday = (date: string): number => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() || 7;
};
