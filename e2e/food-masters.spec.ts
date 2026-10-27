import { expect, type Page, test } from "@playwright/test";
import {
  fillStable,
  gotoHydrated,
  todayInTokyo,
  visibleField,
  visibleText,
} from "./helpers";
import { e2eUser, serviceRoleRest, userIdOf } from "./local-supabase";

// Phase 4 (ui-tech §10): the food master list reads on the server and keeps the search words in ?q=,
// the detail screen is a 404 for an id that is not there, and fixing a master changes the home screen.
// Every case puts its own masters (E2E names) straight into the DB and removes them afterwards.

type FoodMasterRow = {
  name: string;
  brand?: string | null;
  calories?: number;
  deleted_at?: string;
};

const insertFoodMaster = async (row: FoodMasterRow): Promise<string> => {
  const userId = await userIdOf(e2eUser.email);
  const response = await serviceRoleRest("food_masters", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, calories: 100, ...row }),
  });
  const [foodMaster] = (await response.json()) as { id: string }[];
  return foodMaster.id;
};

/** Remove e2eUser's masters whose name starts with the prefix */
const deleteFoodMastersStartingWith = async (prefix: string) => {
  const userId = await userIdOf(e2eUser.email);
  await serviceRoleRest(
    `food_masters?user_id=eq.${userId}&name=like.${encodeURIComponent(`${prefix}*`)}`,
    { method: "DELETE" },
  );
};

// In development Next keeps "use cache: private" results across requests, keyed by the request's cookies
// and headers (node_modules/next/dist/server/use-cache/use-cache-wrapper.js). Every test signs in with the
// same storageState, so a list another test opened earlier would be served again without the rows this test
// put straight into the DB. A header of each test's own gives it a cache of its own; production does not keep
// private caches on the server, so this changes nothing the app does there.
test.beforeEach(async ({ page }, testInfo) => {
  await page.setExtraHTTPHeaders({ "x-e2e-test-id": testInfo.testId });
});

const searchBox = (page: Page) =>
  page.getByRole("searchbox", { name: "食品名・ブランドで検索..." });

const notFoundMessage = (page: Page) =>
  visibleText(page, "ページが見つかりません");

test.describe("フェーズ4: 食品マスタ", () => {
  test.describe("マスタを直すとホームが変わる", () => {
    const name = "E2Eマスタ修正";
    const today = todayInTokyo();
    // Today's lunch: the home tab opens on today. Only the rows made here are removed afterwards
    const mealType = "lunch";
    let createdMealId: string | null = null;
    let itemId = "";

    test.beforeEach(async () => {
      const foodMasterId = await insertFoodMaster({ name, calories: 111 });
      const userId = await userIdOf(e2eUser.email);
      const existing = (await (
        await serviceRoleRest(
          `meals?user_id=eq.${userId}&date=eq.${today}&meal_type=eq.${mealType}&select=id`,
        )
      ).json()) as { id: string }[];
      let mealId = existing[0]?.id;
      if (!mealId) {
        const response = await serviceRoleRest("meals", {
          method: "POST",
          body: JSON.stringify({
            user_id: userId,
            date: today,
            meal_type: mealType,
          }),
        });
        [{ id: mealId }] = (await response.json()) as { id: string }[];
        createdMealId = mealId;
      }
      const response = await serviceRoleRest("meal_items", {
        method: "POST",
        body: JSON.stringify({
          meal_id: mealId,
          name,
          calories: 111,
          source_type: "food_master",
          food_master_id: foodMasterId,
          sort_order: 999,
        }),
      });
      [{ id: itemId }] = (await response.json()) as { id: string }[];
    });

    test.afterEach(async () => {
      await serviceRoleRest(`meal_items?id=eq.${itemId}`, { method: "DELETE" });
      if (createdMealId) {
        await serviceRoleRest(`meals?id=eq.${createdMealId}`, {
          method: "DELETE",
        });
        createdMealId = null;
      }
      await deleteFoodMastersStartingWith(name);
    });

    test("AC-R-6: 食品マスタのカロリーを直してからホームに移ると、そのマスタで記録した食事の値が変わっている", async ({
      page,
    }) => {
      const lunch = page.getByRole("region", { name: "昼食の記録" });
      await gotoHydrated(page, "/home");
      await expect(
        lunch.getByRole("button", { name: /E2Eマスタ修正.*111 kcal/ }),
      ).toBeVisible();

      await page.getByRole("link", { name: "その他" }).click();
      await page.getByRole("link", { name: /食品マスタ/ }).click();
      await page.getByRole("link", { name: /E2Eマスタ修正/ }).click();
      await expect(visibleField(page, /食品名/)).toHaveValue(name);
      await page.waitForLoadState("networkidle");

      await fillStable(page, /カロリー/, "222");
      await page.getByRole("button", { name: "変更を保存" }).click();
      await expect(visibleText(page, "変更を保存しました")).toBeVisible();
      await expect(page).toHaveURL(/\/other\/food-masters$/);

      await page.getByRole("link", { name: "ホーム" }).click();

      await expect(page).toHaveURL(/\/home$/);
      await expect(
        lunch.getByRole("button", { name: /E2Eマスタ修正.*222 kcal/ }),
      ).toBeVisible();
    });
  });

  test.describe("検索語が URL に出る", () => {
    const prefix = "E2Eマスタ検索";
    const brand = "E2Eブランド検索";

    test.beforeEach(async () => {
      await insertFoodMaster({ name: `${prefix}卵`, brand });
      await insertFoodMaster({ name: `${prefix}納豆`, brand: null });
    });

    test.afterEach(async () => {
      await deleteFoodMastersStartingWith(prefix);
    });

    test("S-08・AC-R-3: ブランド名で検索すると URL に検索語が出て、再読み込みしても同じ結果が出る", async ({
      page,
    }) => {
      const searchedUrl = `/other/food-masters?q=${encodeURIComponent(brand)}`;
      await gotoHydrated(page, "/other/food-masters");
      await expect(
        page.getByRole("link", { name: /E2Eマスタ検索納豆/ }),
      ).toBeVisible();

      await expect(async () => {
        await searchBox(page).fill(brand);
        await expect(page).toHaveURL(searchedUrl, { timeout: 2_000 });
      }).toPass({ timeout: 15_000 });

      await expect(
        page.getByRole("link", { name: /E2Eマスタ検索卵/ }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /E2Eマスタ検索納豆/ }),
      ).toHaveCount(0);

      await page.reload();

      await expect(page).toHaveURL(searchedUrl);
      await expect(searchBox(page)).toHaveValue(brand);
      await expect(
        page.getByRole("link", { name: /E2Eマスタ検索卵/ }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /E2Eマスタ検索納豆/ }),
      ).toHaveCount(0);
    });
  });

  test.describe("最初の HTML にデータが入っている", () => {
    const name = "E2E初期HTMLマスタ";

    test.beforeEach(async () => {
      await insertFoodMaster({ name });
    });

    test.afterEach(async () => {
      await deleteFoodMastersStartingWith(name);
    });

    test("AC-R-2: 一覧を開いた最初の HTML にマスタが入っていて、表示の後にブラウザから食品マスタを読まない", async ({
      page,
    }) => {
      const response = await page.request.get("/other/food-masters");
      expect(response.ok()).toBe(true);
      expect(await response.text()).toContain(name);

      const foodMasterReads: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (/\/rest\/v1\/food_masters\b/.test(url)) {
          foodMasterReads.push(url);
        }
      });
      await gotoHydrated(page, "/other/food-masters");
      await expect(
        page.getByRole("link", { name: /E2E初期HTMLマスタ/ }),
      ).toBeVisible();

      expect(foodMasterReads).toEqual([]);
    });
  });

  test.describe("無い id は 404", () => {
    const name = "E2E削除マスタ";

    test.afterEach(async () => {
      await deleteFoodMastersStartingWith(name);
    });

    test("AC-R-7: 消したマスタ・uuid でない id・どこにも無い id の URL は 404 になる", async ({
      page,
    }) => {
      const id = await insertFoodMaster({
        name,
        deleted_at: new Date().toISOString(),
      });

      for (const path of [
        `/other/food-masters/${id}`,
        "/other/food-masters/not-a-master",
        "/other/food-masters/00000000-0000-4000-8000-000000000000",
      ]) {
        await gotoHydrated(page, path);
        await expect(notFoundMessage(page)).toBeVisible();
      }
    });
  });

  test("S-08a: OCR から渡した値(?name=・?calories= など)が、新規の画面の入力に入っている", async ({
    page,
  }) => {
    await gotoHydrated(
      page,
      `/other/food-masters/new?name=${encodeURIComponent("E2E読取バー")}&calories=210&protein=12`,
    );

    await expect(
      page.getByRole("heading", { name: "食品を登録" }),
    ).toBeVisible();
    await expect(visibleField(page, /食品名/)).toHaveValue("E2E読取バー");
    await expect(visibleField(page, /カロリー/)).toHaveValue("210");
    await expect(visibleField(page, "P (g)")).toHaveValue("12");
  });
});
