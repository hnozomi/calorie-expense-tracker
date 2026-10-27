import { expect, type Page, test } from "@playwright/test";
import { gotoHydrated, isoWeekday, todayInTokyo, visibleText } from "./helpers";
import { e2eUser, serviceRoleRest, userIdOf } from "./local-supabase";

// Phase 5 (ui-tech §10): the weekly report reads on the server, keeps the week in ?week=,
// and its calorie bars are links to the day's home screen (S-09).
// Every case puts its own meal (an E2E name, on last week's Wednesday snack, which no other spec uses)
// straight into the DB and removes it afterwards.

const shiftDay = (date: string, days: number): string => {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
};

const mondayOf = (date: string): string => shiftDay(date, 1 - isoWeekday(date));

const thisMonday = mondayOf(todayInTokyo());
const lastMonday = shiftDay(thisMonday, -7);
// Last week's Wednesday is at least 5 days ago, so it is never the "yesterday" the home and plan specs use
const lastWednesday = shiftDay(lastMonday, 2);
const mealName = "E2Eレポート前週";
const calories = 1234;

/** Put one snack straight into the DB */
const insertSnack = async (date: string) => {
  const userId = await userIdOf(e2eUser.email);
  const response = await serviceRoleRest("meals", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, date, meal_type: "snack" }),
  });
  const [meal] = (await response.json()) as { id: string }[];
  await serviceRoleRest("meal_items", {
    method: "POST",
    body: JSON.stringify({ meal_id: meal.id, name: mealName, calories }),
  });
};

/** Remove e2eUser's snack rows of a day; their items go with them (ON DELETE CASCADE) */
const deleteSnacks = async (date: string) => {
  const userId = await userIdOf(e2eUser.email);
  await serviceRoleRest(
    `meals?user_id=eq.${userId}&date=eq.${date}&meal_type=eq.snack`,
    { method: "DELETE" },
  );
};

/** Last week's Wednesday bar: its label carries the day's calories */
const lastWednesdayBar = (page: Page) =>
  page
    .getByRole("link", { name: new RegExp(`^水曜日 ${calories}kcal`) })
    .filter({ visible: true });

// In development Next keeps "use cache: private" results across requests, keyed by the request's cookies and
// headers. A header of each test's own keeps a report another test opened earlier from hiding the rows put
// straight into the DB (the same as recipes.spec.ts and food-masters.spec.ts)
test.beforeEach(async ({ page }, testInfo) => {
  await page.setExtraHTTPHeaders({ "x-e2e-test-id": testInfo.testId });
});

test.describe("フェーズ5: ウィークリーレポート", () => {
  test.describe("週が URL に出る", () => {
    test.beforeEach(async () => {
      await insertSnack(lastWednesday);
    });

    test.afterEach(async () => {
      await deleteSnacks(lastWednesday);
    });

    test("AC-R-3: レポートで前の週に移ると URL に週が出て、その週の集計が出る。戻るボタンで今週に戻る", async ({
      page,
    }) => {
      await gotoHydrated(page, "/other/report");
      await expect(visibleText(page, "今週", { exact: true })).toBeVisible();
      await expect(lastWednesdayBar(page)).toHaveCount(0);

      await page.getByRole("link", { name: "前の週" }).click();

      await expect(page).toHaveURL(`/other/report?week=${lastMonday}`);
      await expect(lastWednesdayBar(page)).toBeVisible();
      await expect(page.getByRole("link", { name: "今週へ" })).toBeVisible();

      await page.goBack();

      await expect(page).toHaveURL(/\/other\/report$/);
      await expect(visibleText(page, "今週", { exact: true })).toBeVisible();
      await expect(lastWednesdayBar(page)).toHaveCount(0);
    });

    test("AC-R-3: 週の付いた URL を開くとその週の集計が出て、再読み込みしても同じ週が出る", async ({
      page,
    }) => {
      await gotoHydrated(page, `/other/report?week=${lastMonday}`);
      await expect(lastWednesdayBar(page)).toBeVisible();
      await expect(page.getByRole("link", { name: "今週へ" })).toBeVisible();

      await page.reload();

      await expect(page).toHaveURL(`/other/report?week=${lastMonday}`);
      await expect(lastWednesdayBar(page)).toBeVisible();
      await expect(page.getByRole("link", { name: "今週へ" })).toBeVisible();
    });

    test("ui-tech §1: 月曜でない ?week= は、その日を含む週を出す(404 にしない)", async ({
      page,
    }) => {
      await gotoHydrated(page, `/other/report?week=${shiftDay(lastMonday, 4)}`);
      await expect(lastWednesdayBar(page)).toBeVisible();
      await expect(page.getByRole("link", { name: "今週へ" })).toBeVisible();
    });

    test("S-09: 棒グラフの棒をタップすると、その日のホーム(/home?date=)に移り、その日の食事が出る", async ({
      page,
    }) => {
      await gotoHydrated(page, `/other/report?week=${lastMonday}`);

      await lastWednesdayBar(page).click();

      await expect(page).toHaveURL(`/home?date=${lastWednesday}`);
      await expect(
        page
          .getByRole("region", { name: "間食の記録" })
          .getByRole("button", { name: new RegExp(mealName) }),
      ).toBeVisible();
    });
  });

  for (const week of ["2026-02-30", "last-week"]) {
    test(`ui-tech §1: 日付として正しくない ?week=${week} は 404 になる`, async ({
      page,
    }) => {
      await page.goto(`/other/report?week=${week}`);
      await expect(visibleText(page, "ページが見つかりません")).toBeVisible();
    });
  }

  test.describe("最初の HTML にデータが入っている", () => {
    test.beforeEach(async () => {
      await insertSnack(lastWednesday);
    });

    test.afterEach(async () => {
      await deleteSnacks(lastWednesday);
    });

    test("AC-R-2: レポートを開いた最初の HTML にその週の集計が入っていて、表示の後にブラウザから DB を読まない", async ({
      page,
    }) => {
      const response = await page.request.get(
        `/other/report?week=${lastMonday}`,
      );
      expect(response.ok()).toBe(true);
      expect(await response.text()).toContain(`水曜日 ${calories}kcal`);

      const dbReads: string[] = [];
      page.on("request", (request) => {
        if (/\/rest\/v1\//.test(request.url())) dbReads.push(request.url());
      });
      await gotoHydrated(page, `/other/report?week=${lastMonday}`);
      await expect(lastWednesdayBar(page)).toBeVisible();

      expect(dbReads).toEqual([]);
    });
  });
});
