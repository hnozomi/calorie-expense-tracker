import { expect, type Page, type Route, test } from "@playwright/test";
import {
  clickToReveal,
  fillStable,
  gotoHydrated,
  isoWeekday,
  openSlotDrawer,
  todayInTokyo,
  visibleField,
  visibleText,
} from "./helpers";
import { e2eUser, serviceRoleRest, userIdOf } from "./local-supabase";

test.describe("献立カレンダー", () => {
  test("手動で献立を追加し、確認ダイアログ経由で削除できる", async ({
    page,
  }) => {
    await gotoHydrated(page, "/plan");
    await expect(visibleText(page, "今週")).toBeVisible();

    // Add a plan in the first breakfast cell
    await clickToReveal(
      page.getByRole("button", { name: "献立を追加" }).first(),
      visibleText(page, "献立のメニューを選択または入力してください"),
    );
    await fillStable(page, "メニュー名", "E2Eカレー");
    await fillStable(page, "カロリー (kcal)", "800");
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await expect(visibleText(page, "献立を保存しました")).toBeVisible();
    await expect(page.getByRole("button", { name: "E2Eカレー" })).toBeVisible();

    // Open the plan and delete it via the confirmation dialog
    await page.getByRole("button", { name: "E2Eカレー" }).click();
    await page.getByRole("button", { name: "この献立を削除する" }).click();
    await expect(visibleText(page, "献立を削除しますか？")).toBeVisible();
    await page.getByRole("button", { name: "削除する" }).click();
    await expect(visibleText(page, "献立を削除しました")).toBeVisible();
    await expect(page.getByRole("button", { name: "E2Eカレー" })).toHaveCount(
      0,
    );
  });

  test("食事記録を「実績を反映」で献立に取り込める", async ({ page }) => {
    // Seed: record yesterday's dinner via the home screen
    await gotoHydrated(page, "/home");
    // Move to yesterday. Since phase 2 the previous day is a link to /home?date= (ui-tech §phase 2)
    await page.getByRole("link", { name: "前の日" }).click();
    await expect(page).toHaveURL(/\/home\?date=\d{4}-\d{2}-\d{2}$/);
    await expect(visibleText(page, "今日へ")).toBeVisible();
    await page.waitForLoadState("networkidle");

    await openSlotDrawer(page, "夕食");
    await fillStable(page, "メニュー名", "E2E実績ラーメン");
    await fillStable(page, "カロリー (kcal)", "600");
    await page.getByRole("button", { name: "カードに追加" }).click();
    await page.getByRole("button", { name: "1件まとめて登録する" }).click();
    await expect(visibleText(page, "1件の食事を登録しました")).toBeVisible({
      timeout: 10_000,
    });

    // Sync actuals on the plan screen. On Mondays "yesterday" belongs to the
    // previous week, so move the calendar back one week first. Monday is decided
    // in Asia/Tokyo like the server's today, not by the machine's time zone.
    await gotoHydrated(page, "/plan");
    await expect(visibleText(page, "週間サマリー")).toBeVisible();
    if (isoWeekday(todayInTokyo()) === 1) {
      // Since phase 3 the previous week is a link to /plan?week= (ui-tech §phase 3)
      await page.getByRole("link", { name: "前の週" }).click();
    }
    await page.getByRole("button", { name: "実績を反映" }).click();
    await expect(
      visibleText(page, "実際に食べた内容を献立に反映しますか？"),
    ).toBeVisible();
    await page.getByRole("button", { name: "反映する" }).click();
    await expect(
      visibleText(page, /枠の献立を実際の食事内容で置き換えました/),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "E2E実績ラーメン" }),
    ).toBeVisible();
  });

  test("既存献立を編集してもPFCと参照が保持される", async ({ page }) => {
    await gotoHydrated(page, "/plan");
    await expect(visibleText(page, "週間サマリー")).toBeVisible();

    // Create a plan with a protein value via the manual tab
    await clickToReveal(
      page.getByRole("button", { name: "献立を追加" }).first(),
      visibleText(page, "献立のメニューを選択または入力してください"),
    );
    await fillStable(page, "メニュー名", "E2E編集前");
    await fillStable(page, "カロリー (kcal)", "800");
    await fillStable(page, "P (g)", "20");
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await expect(visibleText(page, "献立を保存しました")).toBeVisible();

    // Reopen and change only the name — regression guard for the bug where
    // saving via the manual tab silently zeroed PFC
    await clickToReveal(
      page.getByRole("button", { name: "E2E編集前" }),
      visibleText(page, "献立のメニューを選択または入力してください"),
    );
    await fillStable(page, "メニュー名", "E2E編集後");
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await expect(visibleText(page, "献立を保存しました")).toBeVisible();

    // Reopen: the protein value must still be 20
    await clickToReveal(
      page.getByRole("button", { name: "E2E編集後" }),
      visibleText(page, "献立のメニューを選択または入力してください"),
    );
    await expect(visibleField(page, "P (g)")).toHaveValue("20");

    // Clean up so later cases see an empty first breakfast cell
    await page.getByRole("button", { name: "この献立を削除する" }).click();
    await page.getByRole("button", { name: "削除する" }).click();
    await expect(visibleText(page, "献立を削除しました")).toBeVisible();
  });

  test("「今日の献立を転記」で献立が食事記録に反映される", async ({ page }) => {
    // Depends on meal-item.spec: 「献立に反映」 left an untransferred
    // E2Eポテチ plan in today's snack slot
    await gotoHydrated(page, "/plan");
    await expect(visibleText(page, "週間サマリー")).toBeVisible();

    await clickToReveal(
      page.getByRole("button", { name: "今日の献立を転記" }),
      visibleText(page, "今日の献立を食事記録に転記しました"),
    );

    await gotoHydrated(page, "/home");
    await expect(page.getByRole("button", { name: /E2Eポテチ/ })).toBeVisible();
  });
});

// Phase 3 (ui-tech §10): the plan screen reads on the server, keeps the week in ?week=,
// and shows saves at once with useOptimistic.
// Every case uses data of its own (an E2E name, and a week or slot no other spec uses) and removes it afterwards.

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const shiftDay = (date: string, days: number): string => {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
};

const mondayOf = (date: string): string => shiftDay(date, 1 - isoWeekday(date));

/** Put one plan straight into the DB */
const insertPlan = async (
  date: string,
  mealType: MealType,
  plan: { name: string; calories: number },
) => {
  const userId = await userIdOf(e2eUser.email);
  await serviceRoleRest("meal_plans", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      date,
      meal_type: mealType,
      planned_name: plan.name,
      calories: plan.calories,
    }),
  });
};

const deletePlansNamed = async (name: string) => {
  const userId = await userIdOf(e2eUser.email);
  await serviceRoleRest(
    `meal_plans?user_id=eq.${userId}&planned_name=eq.${encodeURIComponent(name)}`,
    { method: "DELETE" },
  );
};

/** Remove e2eUser's meal rows of a day and slot; their items go with them (ON DELETE CASCADE) */
const deleteMeals = async (date: string, mealType: MealType) => {
  const userId = await userIdOf(e2eUser.email);
  await serviceRoleRest(
    `meals?user_id=eq.${userId}&date=eq.${date}&meal_type=eq.${mealType}`,
    { method: "DELETE" },
  );
};

const isServerAction = (route: Route) => {
  const request = route.request();
  return request.method() === "POST" && !!request.headers()["next-action"];
};

/** Hold every Server Action request until release() is called, to look at the screen before the server answers */
const holdServerActions = async (page: Page) => {
  const held: Route[] = [];
  let release: () => void = () => {};
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/plan**", async (route) => {
    if (!isServerAction(route)) {
      await route.fallback();
      return;
    }
    held.push(route);
    await released;
    await route.continue();
  });
  return { heldCount: () => held.length, release };
};

/** Add a plan in the first cell (Monday's breakfast) of the week on screen through the manual tab */
const addToFirstCell = async (page: Page, name: string, calories: string) => {
  await clickToReveal(
    page.getByRole("button", { name: "献立を追加" }).first(),
    visibleText(page, "献立のメニューを選択または入力してください"),
  );
  await fillStable(page, "メニュー名", name);
  await fillStable(page, "カロリー (kcal)", calories);
  await page.getByRole("button", { name: "保存", exact: true }).click();
};

test.describe("フェーズ3: 献立", () => {
  test.describe("週が URL に出る", () => {
    const thisMonday = mondayOf(todayInTokyo());
    const nextMonday = shiftDay(thisMonday, 7);
    const name = "E2E翌週URL確認";

    test.beforeEach(async () => {
      // Next week's Wednesday dinner: SL-1 uses next week's first cell (Monday's breakfast)
      await insertPlan(shiftDay(nextMonday, 2), "dinner", {
        name,
        calories: 321,
      });
    });

    test.afterEach(async () => {
      await deletePlansNamed(name);
    });

    test("AC-R-3: 次の週に移ると URL に週が出て、戻るボタンで前の週に戻る", async ({
      page,
    }) => {
      await gotoHydrated(page, "/plan");
      await expect(visibleText(page, "今週", { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name })).toHaveCount(0);

      await page.getByRole("link", { name: "次の週" }).click();

      await expect(page).toHaveURL(`/plan?week=${nextMonday}`);
      await expect(page.getByRole("button", { name })).toBeVisible();
      await expect(page.getByRole("link", { name: "今週へ" })).toBeVisible();

      await page.goBack();

      await expect(page).toHaveURL(/\/plan$/);
      await expect(visibleText(page, "今週", { exact: true })).toBeVisible();
      await expect(
        page.getByRole("button", { name }).filter({ visible: true }),
      ).toHaveCount(0);
    });

    test("AC-R-3: 週の付いた URL を開くとその週が出て、再読み込みしても同じ週が出る", async ({
      page,
    }) => {
      await gotoHydrated(page, `/plan?week=${nextMonday}`);
      await expect(page.getByRole("button", { name })).toBeVisible();
      await expect(page.getByRole("link", { name: "今週へ" })).toBeVisible();

      await page.reload();

      await expect(page).toHaveURL(`/plan?week=${nextMonday}`);
      await expect(page.getByRole("button", { name })).toBeVisible();
      await expect(page.getByRole("link", { name: "今週へ" })).toBeVisible();
    });

    test("ui-tech §1: 月曜でない ?week= は、その日を含む週を出す(404 にしない)", async ({
      page,
    }) => {
      await gotoHydrated(page, `/plan?week=${shiftDay(nextMonday, 3)}`);
      await expect(page.getByRole("button", { name })).toBeVisible();
      await expect(page.getByRole("link", { name: "今週へ" })).toBeVisible();
    });
  });

  for (const week of ["2026-02-30", "next-week"]) {
    test(`ui-tech §1: 日付として正しくない ?week=${week} は 404 になる`, async ({
      page,
    }) => {
      await page.goto(`/plan?week=${week}`);
      await expect(visibleText(page, "ページが見つかりません")).toBeVisible();
    });
  }

  test.describe("最初の HTML にデータが入っている", () => {
    // A fixed past week no other spec uses
    const week = "2020-02-03";
    const name = "E2E献立初期HTML確認";
    const recipeName = "E2E献立候補レシピ";

    test.beforeEach(async () => {
      await insertPlan(week, "lunch", { name, calories: 210 });
      const userId = await userIdOf(e2eUser.email);
      await serviceRoleRest("recipes", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          name: recipeName,
          servings: 1,
          calories: 480,
        }),
      });
    });

    test.afterEach(async () => {
      await deletePlansNamed(name);
      const userId = await userIdOf(e2eUser.email);
      await serviceRoleRest(
        `recipes?user_id=eq.${userId}&name=eq.${encodeURIComponent(recipeName)}`,
        { method: "DELETE" },
      );
    });

    test("AC-R-2: 最初の HTML にその週の献立が入っていて、表示の後も献立のダイアログを開いても、ブラウザから DB を読まない", async ({
      page,
    }) => {
      const response = await page.request.get(`/plan?week=${week}`);
      expect(response.ok()).toBe(true);
      expect(await response.text()).toContain(name);

      const dbReads: string[] = [];
      page.on("request", (request) => {
        if (/\/rest\/v1\//.test(request.url())) dbReads.push(request.url());
      });
      await gotoHydrated(page, `/plan?week=${week}`);
      await expect(page.getByRole("button", { name })).toBeVisible();

      // The candidates were read with the week on the server, so the dialog shows them without reading
      await clickToReveal(
        page.getByRole("button", { name: "献立を追加" }).first(),
        visibleText(page, "献立のメニューを選択または入力してください"),
      );
      await page.getByRole("tab", { name: "レシピ" }).click();
      await expect(
        page
          .getByRole("dialog")
          .getByRole("button", { name: /E2E献立候補レシピ/ }),
      ).toBeVisible();

      expect(dbReads).toEqual([]);
    });
  });

  test.describe("押した直後に出る", () => {
    // Fixed past weeks no other spec uses, so the totals show only what this case saves
    const week = "2020-02-10";
    const failWeek = "2020-02-17";
    const name = "E2E献立楽観表示";
    const failName = "E2E献立送信失敗";
    /** The day's total under the grid */
    const dayTotal = (page: Page) => visibleText(page, "432", { exact: true });
    /** The weekly summary's calories */
    const weeklyTotal = (page: Page) => visibleText(page, /^432\s*kcal$/);

    test.afterEach(async () => {
      await deletePlansNamed(name);
      await deletePlansNamed(failName);
    });

    test("AC-R-5: 献立を保存すると、サーバーの応答を待たずにセルと週間合計に出る", async ({
      page,
    }) => {
      await gotoHydrated(page, `/plan?week=${week}`);
      await expect(dayTotal(page)).toHaveCount(0);
      await expect(weeklyTotal(page)).toHaveCount(0);

      const actions = await holdServerActions(page);
      await addToFirstCell(page, name, "432");

      // The save has not reached the server yet
      await expect.poll(actions.heldCount).toBeGreaterThan(0);
      await expect(page.getByRole("button", { name })).toBeVisible();
      await expect(dayTotal(page)).toBeVisible();
      await expect(weeklyTotal(page)).toBeVisible();

      actions.release();
      await expect(visibleText(page, "献立を保存しました")).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole("button", { name })).toBeEnabled();
      await expect(dayTotal(page)).toBeVisible();
      await expect(weeklyTotal(page)).toBeVisible();
    });

    test("AC-R-5: 保存の送信が失敗すると、セルから消えてエラーが出て、ダイアログが打った値のまま開き直す", async ({
      page,
    }) => {
      await gotoHydrated(page, `/plan?week=${failWeek}`);
      await page.route("**/plan**", async (route) => {
        if (isServerAction(route)) {
          await route.abort("internetdisconnected");
          return;
        }
        await route.fallback();
      });

      await addToFirstCell(page, failName, "345");

      await expect(
        visibleText(page, `「${failName}」の保存に失敗しました`),
      ).toBeVisible({ timeout: 10_000 });
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(visibleField(page, "メニュー名")).toHaveValue(failName);
      await expect(visibleField(page, "カロリー (kcal)")).toHaveValue("345");

      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(page.getByRole("button", { name: failName })).toHaveCount(0);
    });
  });

  test.describe("献立で変えたものがホームタブに出る", () => {
    const today = todayInTokyo();
    const name = "E2E献立転記確認";

    test.beforeEach(async () => {
      // Today's dinner: QA-1 needs it empty later, so afterEach empties it again
      await insertPlan(today, "dinner", { name, calories: 543 });
    });

    test.afterEach(async () => {
      await deleteMeals(today, "dinner");
      await deletePlansNamed(name);
    });

    test("AC-R-6: 献立で「今日の献立を転記」してからホームタブに移ると、転記した食事が出ている", async ({
      page,
    }) => {
      // Open home first, so the move back to it later is a tab switch that can show stale data
      await gotoHydrated(page, "/home");
      const dinner = page.getByRole("region", { name: "夕食の記録" });
      await expect(
        dinner.getByRole("button", { name: /E2E献立転記確認/ }),
      ).toHaveCount(0);

      await page.getByRole("link", { name: "献立" }).click();
      await expect(page.getByRole("button", { name })).toBeVisible();
      await page.waitForLoadState("networkidle");
      await clickToReveal(
        page.getByRole("button", { name: "今日の献立を転記" }),
        visibleText(page, "今日の献立を食事記録に転記しました"),
      );

      await page.getByRole("link", { name: "ホーム" }).click();
      await expect(page).toHaveURL(/\/home$/);
      await expect(
        page
          .getByRole("region", { name: "夕食の記録" })
          .getByRole("button", { name: /E2E献立転記確認.*543 kcal/ }),
      ).toBeVisible();
    });
  });
});
