import { expect, type Page, test } from "@playwright/test";
import {
  fillStable,
  gotoHydrated,
  loginViaUi,
  openSlotDrawer,
  visibleText,
} from "./helpers";
import {
  e2eSwitchUsers,
  e2eUser,
  serviceRoleRest,
  userIdOf,
} from "./local-supabase";

// The browser runs in the host timezone, and the home screen shows the browser's today
const todayInHostTimezone = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

/** Delete the meal items with this name, and their meal when nothing else is left in it */
const deleteMealItemsNamed = async (userEmail: string, name: string) => {
  const userId = await userIdOf(userEmail);
  const response = await serviceRoleRest(
    `meal_items?name=eq.${encodeURIComponent(name)}&select=id,meal_id,meals!inner(user_id)&meals.user_id=eq.${userId}`,
  );
  const items = (await response.json()) as { id: string; meal_id: string }[];
  for (const item of items) {
    await serviceRoleRest(`meal_items?id=eq.${item.id}`, { method: "DELETE" });
    const rest = await serviceRoleRest(
      `meal_items?meal_id=eq.${item.meal_id}&select=id`,
    );
    if (((await rest.json()) as unknown[]).length === 0) {
      await serviceRoleRest(`meals?id=eq.${item.meal_id}`, {
        method: "DELETE",
      });
    }
  }
};

/** Record in the page whether any skeleton becomes visible from now on.
 *  Checked every animation frame so a skeleton shown for a single frame is caught */
const watchForSkeleton = async (page: Page) => {
  await page.evaluate(() => {
    const state = window as unknown as { __skeletonSeen: boolean };
    state.__skeletonSeen = false;
    const check = () => {
      const visible = Array.from(
        document.querySelectorAll<HTMLElement>('[data-slot="skeleton"]'),
      ).some((element) => element.checkVisibility());
      if (visible) state.__skeletonSeen = true;
      requestAnimationFrame(check);
    };
    check();
  });
};

const skeletonWasSeen = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __skeletonSeen: boolean }).__skeletonSeen,
  );

test.describe("フェーズ1: 隠れて残る画面", () => {
  const recordedName = "E2E再訪チェック";

  test.afterEach(async () => {
    await deleteMealItemsNamed(e2eUser.email, recordedName);
  });

  test("確かめる流れ1 (AC-R-4): ホームで記録してから献立タブに移り、ホームに戻ると記録した食事がスケルトンを挟まずに出る", async ({
    page,
  }) => {
    await gotoHydrated(page, "/home");

    await openSlotDrawer(page, "間食");
    await fillStable(page, "メニュー名", recordedName);
    await fillStable(page, "カロリー (kcal)", "120");
    await page.getByRole("button", { name: "カードに追加" }).click();
    await page.getByRole("button", { name: "1件まとめて登録する" }).click();
    await expect(visibleText(page, "1件の食事を登録しました")).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole("button", { name: new RegExp(recordedName) }),
    ).toBeVisible();

    await page.getByRole("link", { name: "献立" }).click();
    await expect(
      page.getByRole("heading", { name: "献立カレンダー" }),
    ).toBeVisible();
    await page.waitForLoadState("networkidle");

    await watchForSkeleton(page);
    await page.getByRole("link", { name: "ホーム" }).click();
    await expect(
      page.getByRole("button", { name: new RegExp(recordedName) }),
    ).toBeVisible();
    await page.waitForLoadState("networkidle");

    expect(await skeletonWasSeen(page)).toBe(false);
  });
});

test.describe("フェーズ1: ログアウト", () => {
  // This flow is about logging in and out, so it starts signed out and uses users of its own:
  // signing out revokes every session of the user, which would break the shared e2eUser
  test.use({ storageState: { cookies: [], origins: [] } });

  const previousUsersMeal = "E2E前の利用者の朝食";
  let insertedMealId: string | undefined;

  test.beforeEach(async () => {
    const userId = await userIdOf(e2eSwitchUsers.previous.email);
    const response = await serviceRoleRest("meals", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        date: todayInHostTimezone(),
        meal_type: "breakfast",
      }),
    });
    const [meal] = (await response.json()) as { id: string }[];
    insertedMealId = meal.id;
    await serviceRoleRest("meal_items", {
      method: "POST",
      body: JSON.stringify({
        meal_id: meal.id,
        name: previousUsersMeal,
        calories: 350,
      }),
    });
  });

  test.afterEach(async () => {
    if (insertedMealId) {
      await serviceRoleRest(`meals?id=eq.${insertedMealId}`, {
        method: "DELETE",
      });
      insertedMealId = undefined;
    }
  });

  test("確かめる流れ2: ログアウトして別の利用者でログインし直すと、ホームに前の利用者の表示が出ない", async ({
    page,
  }) => {
    await loginViaUi(page, e2eSwitchUsers.previous);
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("button", { name: new RegExp(previousUsersMeal) }),
    ).toBeVisible();

    // Move inside the app (no page load), so the home screen stays hidden behind the next screens
    await page.getByRole("link", { name: "その他" }).click();
    await page.getByRole("link", { name: /設定/ }).click();
    await page.getByRole("button", { name: "ログアウト" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "ログアウト" })
      .click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    await loginViaUi(page, e2eSwitchUsers.next, { navigate: false });
    await page.waitForLoadState("networkidle");
    // The next user has no meals: an empty slot offers 登録する (a filled one offers 追加する)
    const breakfast = page.getByRole("region", { name: "朝食の記録" });
    await expect(
      breakfast.getByRole("button", { name: "登録する" }),
    ).toBeVisible();

    // Not even on a hidden screen: the previous user's data must be gone from the page
    await expect(page.getByText(previousUsersMeal)).toHaveCount(0);
  });
});
