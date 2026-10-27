import { expect, type Page, type Route, test } from "@playwright/test";
import {
  clickToReveal,
  fillStable,
  gotoHydrated,
  openSlotDrawer,
  visibleText,
} from "./helpers";
import { e2eUser, serviceRoleRest, userIdOf } from "./local-supabase";

// Phase 2 (ui-tech §10): the home screen reads on the server, keeps the day in ?date=,
// and shows registrations at once with useOptimistic.
// Every case uses data of its own (an E2E name, and a day or slot no other spec uses) and removes it afterwards.

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
type MealType = (typeof MEAL_TYPES)[number];

/** The server decides today in Asia/Tokyo (getTodayInTokyo), so the test does the same */
const todayInTokyo = (): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(
    new Date(),
  );

const shiftDay = (date: string, days: number): string => {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
};

/** Monday = 1 ... Sunday = 7 for a YYYY-MM-DD day */
const isoWeekday = (date: string): number => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() || 7;
};

/** Put one item in a slot of a day straight into the DB, returning the meal row id */
const insertMeal = async (
  date: string,
  mealType: MealType,
  item: { name: string; calories: number },
): Promise<string> => {
  const userId = await userIdOf(e2eUser.email);
  const response = await serviceRoleRest("meals", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, date, meal_type: mealType }),
  });
  const [meal] = (await response.json()) as { id: string }[];
  await serviceRoleRest("meal_items", {
    method: "POST",
    body: JSON.stringify({ meal_id: meal.id, ...item }),
  });
  return meal.id;
};

/** Remove e2eUser's meal rows of a day and slot; their items go with them (ON DELETE CASCADE) */
const deleteMeals = async (date: string, mealType: MealType) => {
  const userId = await userIdOf(e2eUser.email);
  await serviceRoleRest(
    `meals?user_id=eq.${userId}&date=eq.${date}&meal_type=eq.${mealType}`,
    { method: "DELETE" },
  );
};

const deletePlansNamed = async (name: string) => {
  const userId = await userIdOf(e2eUser.email);
  await serviceRoleRest(
    `meal_plans?user_id=eq.${userId}&planned_name=eq.${encodeURIComponent(name)}`,
    { method: "DELETE" },
  );
};

/** Hold every Server Action request until release() is called, to look at the screen before the server answers */
const holdServerActions = async (page: Page) => {
  const held: Route[] = [];
  let release: () => void = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/home**", async (route) => {
    const request = route.request();
    if (request.method() !== "POST" || !request.headers()["next-action"]) {
      await route.fallback();
      return;
    }
    held.push(route);
    await released;
    await route.continue();
  });
  return {
    heldCount: () => held.length,
    release,
  };
};

const addManualDraft = async (page: Page, name: string, calories: string) => {
  await fillStable(page, "メニュー名", name);
  await fillStable(page, "カロリー (kcal)", calories);
  await page.getByRole("button", { name: "カードに追加" }).click();
  await expect(visibleText(page, `直前: ${name}`)).toBeVisible();
};

test.describe("フェーズ2: ホーム", () => {
  test.describe("日付が URL に出る", () => {
    const today = todayInTokyo();
    const yesterday = shiftDay(today, -1);
    const name = "E2E前日URL確認";

    test.beforeEach(async () => {
      await insertMeal(yesterday, "lunch", { name, calories: 321 });
    });

    test.afterEach(async () => {
      await deleteMeals(yesterday, "lunch");
    });

    test("AC-R-3: 前の日に移ると URL に日付が出て、再読み込みしても同じ日の食事が出る", async ({
      page,
    }) => {
      await gotoHydrated(page, "/home");
      await expect(
        page.getByRole("button", { name: /E2E前日URL確認/ }),
      ).toHaveCount(0);

      await page.getByRole("link", { name: "前の日" }).click();

      await expect(page).toHaveURL(`/home?date=${yesterday}`);
      const lunch = page.getByRole("region", { name: "昼食の記録" });
      await expect(
        lunch.getByRole("button", { name: /E2E前日URL確認.*321 kcal/ }),
      ).toBeVisible();

      await page.reload();

      await expect(page).toHaveURL(`/home?date=${yesterday}`);
      await expect(
        page
          .getByRole("region", { name: "昼食の記録" })
          .getByRole("button", { name: /E2E前日URL確認.*321 kcal/ }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "今日へ" })).toBeVisible();
    });

    test("AC-R-3: 前の日に移ってから戻るボタンで今日に戻る", async ({
      page,
    }) => {
      await gotoHydrated(page, "/home");
      await page.getByRole("link", { name: "前の日" }).click();
      await expect(page).toHaveURL(`/home?date=${yesterday}`);
      await expect(
        page.getByRole("button", { name: /E2E前日URL確認/ }),
      ).toBeVisible();

      await page.goBack();

      await expect(page).toHaveURL(/\/home$/);
      await expect(visibleText(page, "今日", { exact: true })).toBeVisible();
      await expect(
        page
          .getByRole("button", { name: /E2E前日URL確認/ })
          .filter({ visible: true }),
      ).toHaveCount(0);
    });

    test("AC-R-3: 日付の付いた URL を直接開くと、その日の食事が出る", async ({
      page,
    }) => {
      await gotoHydrated(page, `/home?date=${yesterday}`);
      await expect(
        page
          .getByRole("region", { name: "昼食の記録" })
          .getByRole("button", { name: /E2E前日URL確認/ }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "今日へ" })).toBeVisible();
    });
  });

  test("AC-R-3: 日付として正しくない ?date= は 404 になる", async ({
    page,
  }) => {
    await page.goto("/home?date=2026-02-30");
    await expect(visibleText(page, "ページが見つかりません")).toBeVisible();
  });

  test.describe("最初の HTML にデータが入っている", () => {
    // A fixed past day no other spec uses
    const day = "2020-01-10";
    const name = "E2E初期HTML確認";

    test.beforeEach(async () => {
      await insertMeal(day, "breakfast", { name, calories: 210 });
    });

    test.afterEach(async () => {
      await deleteMeals(day, "breakfast");
    });

    test("AC-R-2: 画面を開いた最初の HTML にその日の食事が入っていて、表示の後にブラウザから食事を読まない", async ({
      page,
    }) => {
      const response = await page.request.get(`/home?date=${day}`);
      expect(response.ok()).toBe(true);
      expect(await response.text()).toContain(name);

      const mealReads: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (
          /\/rest\/v1\/(meals|meal_items)\b/.test(url) ||
          /\/rest\/v1\/rpc\/get_daily_summary\b/.test(url)
        ) {
          mealReads.push(url);
        }
      });
      await gotoHydrated(page, `/home?date=${day}`);
      await expect(
        page.getByRole("button", { name: /E2E初期HTML確認/ }),
      ).toBeVisible();

      expect(mealReads).toEqual([]);
    });
  });

  test.describe("押した直後に出る", () => {
    // Fixed past days no other spec uses, so the summary shows only what this case registers
    const day = "2020-01-08";
    const failDay = "2020-01-09";
    const name = "E2E楽観表示";

    test.afterEach(async () => {
      await deleteMeals(day, "dinner");
      await deleteMeals(failDay, "lunch");
    });

    test("AC-R-5: 食事を登録すると、サーバーの応答を待たずにスロットと集計に出る", async ({
      page,
    }) => {
      await gotoHydrated(page, `/home?date=${day}`);
      await expect(visibleText(page, "432", { exact: true })).toHaveCount(0);

      const actions = await holdServerActions(page);
      await openSlotDrawer(page, "夕食");
      await addManualDraft(page, name, "432");
      await page.getByRole("button", { name: "1件まとめて登録する" }).click();

      // The registration has not reached the server yet
      await expect.poll(actions.heldCount).toBeGreaterThan(0);
      const dinner = page.getByRole("region", { name: "夕食の記録" });
      await expect(
        dinner.getByRole("button", { name: /E2E楽観表示.*432 kcal/ }),
      ).toBeVisible();
      await expect(visibleText(page, "432", { exact: true })).toBeVisible();

      actions.release();
      await expect(visibleText(page, "1件の食事を登録しました")).toBeVisible({
        timeout: 10_000,
      });
      await expect(
        dinner.getByRole("button", { name: /E2E楽観表示.*432 kcal/ }),
      ).toBeVisible();
      await expect(visibleText(page, "432", { exact: true })).toBeVisible();
    });

    test("AC-R-5: 登録の送信が失敗すると、スロットから消えてエラーが出て、下書きが残る", async ({
      page,
    }) => {
      await gotoHydrated(page, `/home?date=${failDay}`);
      await page.route("**/home**", async (route) => {
        const request = route.request();
        if (request.method() === "POST" && request.headers()["next-action"]) {
          await route.abort("internetdisconnected");
          return;
        }
        await route.fallback();
      });

      await openSlotDrawer(page, "昼食");
      await addManualDraft(page, "E2E送信失敗", "345");
      await page.getByRole("button", { name: "1件まとめて登録する" }).click();

      await expect(
        visibleText(page, "登録に失敗しました。もう一度お試しください"),
      ).toBeVisible({ timeout: 10_000 });
      // The Drawer reopens with the draft; while this modal is open the slots behind it are aria-hidden
      await expect(
        page.getByRole("dialog", { name: "昼食を登録" }),
      ).toBeVisible();
      await expect(visibleText(page, "直前: E2E送信失敗")).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(
        visibleText(page, "入力中のアイテムを破棄しますか?"),
      ).toBeVisible();
      await page.getByRole("button", { name: "破棄して閉じる" }).click();
      await expect(
        page.getByRole("dialog", { name: "昼食を登録" }),
      ).toHaveCount(0);

      // The slot is readable again, so the count of 0 below looks at its content
      const lunch = page.getByRole("region", { name: "昼食の記録" });
      await expect(
        lunch.getByRole("button", { name: /登録する/ }),
      ).toBeVisible();
      await expect(
        lunch.getByRole("button", { name: /E2E送信失敗/ }),
      ).toHaveCount(0);
    });
  });

  test.describe("ホームで変えたものが献立タブに出る", () => {
    // A day of this week that is not today (the plan tab shows this week): yesterday, or tomorrow on Mondays
    const today = todayInTokyo();
    const isMonday = isoWeekday(today) === 1;
    const day = shiftDay(today, isMonday ? 1 : -1);
    const moveLink = isMonday ? "次の日" : "前の日";
    const name = "E2E献立反映確認";

    test.beforeEach(async () => {
      await insertMeal(day, "lunch", { name, calories: 555 });
    });

    test.afterEach(async () => {
      await deleteMeals(day, "lunch");
      await deletePlansNamed(name);
    });

    test("AC-R-6: ホームで「献立に反映」してから献立タブに移ると、反映した献立が出ている", async ({
      page,
    }) => {
      // Open the plan tab first, so the move back to it later is a tab switch that can show stale data
      await gotoHydrated(page, "/plan");
      await expect(
        page.getByRole("heading", { name: "献立カレンダー" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name })).toHaveCount(0);

      await page.getByRole("link", { name: "ホーム" }).click();
      await page.getByRole("link", { name: moveLink }).click();
      await expect(page).toHaveURL(`/home?date=${day}`);
      const lunch = page.getByRole("region", { name: "昼食の記録" });
      await expect(
        lunch.getByRole("button", { name: /E2E献立反映確認/ }),
      ).toBeVisible();
      await page.waitForLoadState("networkidle");

      await clickToReveal(
        lunch.getByRole("button", { name: "献立に反映" }),
        visibleText(page, "献立に反映しますか？"),
      );
      await page.getByRole("button", { name: "反映する" }).click();
      await expect(visibleText(page, "献立に反映しました")).toBeVisible();

      await page.getByRole("link", { name: "献立" }).click();
      await expect(
        page.getByRole("heading", { name: "献立カレンダー" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name })).toBeVisible();
    });
  });
});
