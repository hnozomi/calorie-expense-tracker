import { expect, type Page, test } from "@playwright/test";
import { fillStable, gotoHydrated, visibleField, visibleText } from "./helpers";
import { e2eUser, serviceRoleRest, userIdOf } from "./local-supabase";

// Phase 5 (ui-tech §10): the set menu list reads on the server and keeps the search words in ?q=, the edit
// screen is a 404 for an id that is not there, and a set menu deleted while it is being edited is not saved.
// Every case puts its own set menus (E2E names) straight into the DB and removes them afterwards.

type SetMenuRow = {
  name: string;
  total_calories?: number;
  deleted_at?: string;
};

const insertSetMenu = async (
  row: SetMenuRow,
  itemName = "E2Eセットのご飯",
): Promise<string> => {
  const userId = await userIdOf(e2eUser.email);
  const response = await serviceRoleRest("set_menus", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, total_calories: 250, ...row }),
  });
  const [setMenu] = (await response.json()) as { id: string }[];
  await serviceRoleRest("set_menu_items", {
    method: "POST",
    body: JSON.stringify({
      set_menu_id: setMenu.id,
      name: itemName,
      calories: 250,
      serving_quantity: 1,
      sort_order: 0,
    }),
  });
  return setMenu.id;
};

/** Remove e2eUser's set menus whose name starts with the prefix; their items go with them (ON DELETE CASCADE) */
const deleteSetMenusStartingWith = async (prefix: string) => {
  const userId = await userIdOf(e2eUser.email);
  await serviceRoleRest(
    `set_menus?user_id=eq.${userId}&name=like.${encodeURIComponent(`${prefix}*`)}`,
    { method: "DELETE" },
  );
};

const setMenuOf = async (
  id: string,
): Promise<{
  name: string;
  total_calories: number;
  deleted_at: string | null;
}> => {
  const response = await serviceRoleRest(
    `set_menus?id=eq.${id}&select=name,total_calories,deleted_at`,
  );
  const [row] = (await response.json()) as {
    name: string;
    total_calories: number;
    deleted_at: string | null;
  }[];
  return row;
};

// In development Next keeps "use cache: private" results across requests, keyed by the request's cookies
// and headers. A header of each test's own keeps a list another test opened earlier from hiding the rows
// put straight into the DB (the same as recipes.spec.ts and food-masters.spec.ts)
test.beforeEach(async ({ page }, testInfo) => {
  await page.setExtraHTTPHeaders({ "x-e2e-test-id": testInfo.testId });
});

const searchBox = (page: Page) =>
  page.getByRole("searchbox", { name: "セットメニュー名で検索..." });

const notFoundMessage = (page: Page) =>
  visibleText(page, "ページが見つかりません");

test.describe("フェーズ5: セットメニュー", () => {
  test.describe("検索語が URL に出る", () => {
    const prefix = "E2Eセット検索";

    test.beforeEach(async () => {
      await insertSetMenu({ name: `${prefix}朝定食` });
      await insertSetMenu({ name: `${prefix}カレー` });
    });

    test.afterEach(async () => {
      await deleteSetMenusStartingWith(prefix);
    });

    test("AC-R-3: セットメニューを検索すると URL に検索語が出て、再読み込みしても同じ結果が出る", async ({
      page,
    }) => {
      const words = `${prefix}カレー`;
      const searchedUrl = `/other/set-menus?q=${encodeURIComponent(words)}`;
      await gotoHydrated(page, "/other/set-menus");
      await expect(
        page.getByRole("link", { name: /E2Eセット検索朝定食/ }),
      ).toBeVisible();

      await expect(async () => {
        await searchBox(page).fill(words);
        await expect(page).toHaveURL(searchedUrl, { timeout: 2_000 });
      }).toPass({ timeout: 15_000 });

      await expect(
        page.getByRole("link", { name: /E2Eセット検索カレー/ }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /E2Eセット検索朝定食/ }),
      ).toHaveCount(0);

      await page.reload();

      await expect(page).toHaveURL(searchedUrl);
      await expect(searchBox(page)).toHaveValue(words);
      await expect(
        page.getByRole("link", { name: /E2Eセット検索カレー/ }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /E2Eセット検索朝定食/ }),
      ).toHaveCount(0);
    });
  });

  test.describe("最初の HTML にデータが入っている", () => {
    const name = "E2E初期HTMLセット";

    test.beforeEach(async () => {
      await insertSetMenu({ name });
    });

    test.afterEach(async () => {
      await deleteSetMenusStartingWith(name);
    });

    test("AC-R-2: 一覧を開いた最初の HTML にセットメニューが入っていて、表示の後にブラウザからセットメニューを読まない", async ({
      page,
    }) => {
      const response = await page.request.get("/other/set-menus");
      expect(response.ok()).toBe(true);
      expect(await response.text()).toContain(name);

      const setMenuReads: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (/\/rest\/v1\/set_menu/.test(url)) {
          setMenuReads.push(url);
        }
      });
      await gotoHydrated(page, "/other/set-menus");
      await expect(
        page.getByRole("link", { name: /E2E初期HTMLセット/ }),
      ).toBeVisible();

      expect(setMenuReads).toEqual([]);
    });
  });

  test.describe("無い id は 404", () => {
    const name = "E2E削除セット";

    test.afterEach(async () => {
      await deleteSetMenusStartingWith(name);
    });

    test("AC-R-7: 消したセットメニュー・uuid でない id・どこにも無い id の URL は 404 になる", async ({
      page,
    }) => {
      const id = await insertSetMenu({
        name,
        deleted_at: new Date().toISOString(),
      });

      for (const path of [
        `/other/set-menus/${id}`,
        "/other/set-menus/not-a-set-menu",
        "/other/set-menus/00000000-0000-4000-8000-000000000000",
      ]) {
        await gotoHydrated(page, path);
        await expect(notFoundMessage(page)).toBeVisible();
      }
    });
  });

  test.describe("編集中に消されたセットメニュー", () => {
    const name = "E2E編集中削除セット";

    test.afterEach(async () => {
      await deleteSetMenusStartingWith(name);
    });

    test("ui-tech フェーズ5: 編集の画面を開いている間に消されたセットメニューは、保存しても保存できたことにならず、画面に残る", async ({
      page,
    }) => {
      const id = await insertSetMenu({ name });
      await gotoHydrated(page, `/other/set-menus/${id}`);
      await expect(visibleField(page, /セットメニュー名/)).toHaveValue(name);

      await serviceRoleRest(`set_menus?id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify({ deleted_at: new Date().toISOString() }),
      });
      await fillStable(page, /セットメニュー名/, `${name}改`);
      await page.getByRole("button", { name: "変更を保存" }).click();

      await expect(visibleText(page, "保存に失敗しました")).toBeVisible();
      await expect(page).toHaveURL(`/other/set-menus/${id}`);
      expect((await setMenuOf(id)).name).toBe(name);
    });
  });

  test.describe("登録", () => {
    const name = "E2E登録セット";
    const masterName = "E2Eセット用マスタ";

    test.beforeEach(async () => {
      const userId = await userIdOf(e2eUser.email);
      await serviceRoleRest("food_masters", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          name: masterName,
          calories: 200,
          default_price: 100,
        }),
      });
    });

    test.afterEach(async () => {
      await deleteSetMenusStartingWith(name);
      const userId = await userIdOf(e2eUser.email);
      await serviceRoleRest(
        `food_masters?user_id=eq.${userId}&name=eq.${encodeURIComponent(masterName)}`,
        { method: "DELETE" },
      );
    });

    test("S-06a: マスタから追加して分量を 1.5 にして登録すると、一覧に出て、合計は分量を掛けた値で保存される", async ({
      page,
    }) => {
      await gotoHydrated(page, "/other/set-menus/new");
      await expect(
        page.getByRole("heading", { name: "セットメニューを登録" }),
      ).toBeVisible();

      await fillStable(page, /セットメニュー名/, name);
      await page.getByRole("tab", { name: "マスタから" }).click();
      await page.getByRole("button", { name: new RegExp(masterName) }).click();
      await page
        .getByRole("button", { name: `「${masterName}」を増やす` })
        .click();
      await expect(visibleText(page, /^合計: 300 kcal · ¥150$/)).toBeVisible();

      await page.getByRole("button", { name: /登録する/ }).click();

      await expect(
        visibleText(page, "セットメニューを登録しました"),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/other\/set-menus$/);
      const card = page.getByRole("link", { name: new RegExp(name) });
      await expect(card).toBeVisible();
      await expect(card).toContainText("300");

      const userId = await userIdOf(e2eUser.email);
      const rows = (await (
        await serviceRoleRest(
          `set_menus?user_id=eq.${userId}&name=eq.${encodeURIComponent(name)}&select=total_calories,total_cost`,
        )
      ).json()) as { total_calories: number; total_cost: number }[];
      expect(rows).toEqual([{ total_calories: 300, total_cost: 150 }]);
    });
  });
});
