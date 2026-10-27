import { expect, type Page, test } from "@playwright/test";
import { fillStable, gotoHydrated, visibleField, visibleText } from "./helpers";
import { e2eUser, serviceRoleRest, userIdOf } from "./local-supabase";

// Phase 4 (ui-tech §10): the recipe list reads on the server and keeps the search words in ?q=,
// and the detail screen is a 404 for an id that is not there.
// Every case puts its own recipes (E2E names) straight into the DB and removes them afterwards.

const insertRecipe = async (name: string): Promise<string> => {
  const userId = await userIdOf(e2eUser.email);
  const response = await serviceRoleRest("recipes", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, name, servings: 1, calories: 500 }),
  });
  const [recipe] = (await response.json()) as { id: string }[];
  return recipe.id;
};

const markRecipeDeleted = async (id: string) => {
  await serviceRoleRest(`recipes?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ deleted_at: new Date().toISOString() }),
  });
};

const recipeNamed = async (id: string) => {
  const response = await serviceRoleRest(`recipes?id=eq.${id}&select=name`);
  const [recipe] = (await response.json()) as { name: string }[];
  return recipe.name;
};

/** Remove e2eUser's recipes whose name starts with the prefix (their ingredients go with them) */
const deleteRecipesStartingWith = async (prefix: string) => {
  const userId = await userIdOf(e2eUser.email);
  await serviceRoleRest(
    `recipes?user_id=eq.${userId}&name=like.${encodeURIComponent(`${prefix}*`)}`,
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
  page.getByRole("searchbox", { name: "レシピ名で検索..." });

const notFoundMessage = (page: Page) =>
  visibleText(page, "ページが見つかりません");

test.describe("フェーズ4: レシピ", () => {
  test.describe("検索語が URL に出る", () => {
    const prefix = "E2E検索";

    test.beforeEach(async () => {
      await insertRecipe(`${prefix}カレー`);
      await insertRecipe(`${prefix}サラダ`);
    });

    test.afterEach(async () => {
      await deleteRecipesStartingWith(prefix);
    });

    test("AC-R-3: レシピを検索すると URL に検索語が出て、再読み込みしても同じ結果が出る", async ({
      page,
    }) => {
      const query = `${prefix}カレー`;
      const searchedUrl = `/recipes?q=${encodeURIComponent(query)}`;
      await gotoHydrated(page, "/recipes");
      await expect(
        page.getByRole("link", { name: /E2E検索サラダ/ }),
      ).toBeVisible();

      await expect(async () => {
        await searchBox(page).fill(query);
        await expect(page).toHaveURL(searchedUrl, { timeout: 2_000 });
      }).toPass({ timeout: 15_000 });

      await expect(
        page.getByRole("link", { name: /E2E検索カレー/ }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /E2E検索サラダ/ }),
      ).toHaveCount(0);

      await page.reload();

      await expect(page).toHaveURL(searchedUrl);
      await expect(searchBox(page)).toHaveValue(query);
      await expect(
        page.getByRole("link", { name: /E2E検索カレー/ }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /E2E検索サラダ/ }),
      ).toHaveCount(0);
    });

    test("ui-tech フェーズ4: 検索欄を空にすると ?q= が外れて、全部のレシピに戻る", async ({
      page,
    }) => {
      await gotoHydrated(
        page,
        `/recipes?q=${encodeURIComponent(`${prefix}カレー`)}`,
      );
      await expect(
        page.getByRole("link", { name: /E2E検索サラダ/ }),
      ).toHaveCount(0);

      await expect(async () => {
        await searchBox(page).fill("");
        await expect(page).toHaveURL(/\/recipes$/, { timeout: 2_000 });
      }).toPass({ timeout: 15_000 });

      await expect(
        page.getByRole("link", { name: /E2E検索サラダ/ }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /E2E検索カレー/ }),
      ).toBeVisible();
    });
  });

  test.describe("最初の HTML にデータが入っている", () => {
    const name = "E2E初期HTMLレシピ";

    test.beforeEach(async () => {
      await insertRecipe(name);
    });

    test.afterEach(async () => {
      await deleteRecipesStartingWith(name);
    });

    test("AC-R-2: 一覧を開いた最初の HTML にレシピが入っていて、表示の後にブラウザからレシピを読まない", async ({
      page,
    }) => {
      const response = await page.request.get("/recipes");
      expect(response.ok()).toBe(true);
      expect(await response.text()).toContain(name);

      const recipeReads: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (/\/rest\/v1\/(recipes|recipe_ingredients)\b/.test(url)) {
          recipeReads.push(url);
        }
      });
      await gotoHydrated(page, "/recipes");
      await expect(
        page.getByRole("link", { name: /E2E初期HTMLレシピ/ }),
      ).toBeVisible();

      expect(recipeReads).toEqual([]);
    });
  });

  test.describe("無い id は 404", () => {
    const name = "E2E削除レシピ";

    test.afterEach(async () => {
      await deleteRecipesStartingWith(name);
    });

    test("AC-R-7: 消したレシピの URL を開くと 404 が出る", async ({ page }) => {
      const id = await insertRecipe(name);
      await gotoHydrated(page, `/recipes/${id}`);
      await expect(visibleField(page, /レシピ名/)).toHaveValue(name);

      await page.getByRole("button", { name: /このレシピを削除する/ }).click();
      await page.getByRole("button", { name: "削除する" }).click();

      await expect(visibleText(page, "レシピを削除しました")).toBeVisible();
      await expect(page).toHaveURL(/\/recipes$/);
      await expect(
        page.getByRole("link", { name: /E2E削除レシピ/ }),
      ).toHaveCount(0);

      await gotoHydrated(page, `/recipes/${id}`);
      await expect(notFoundMessage(page)).toBeVisible();
    });

    test("AC-R-7: uuid でない id・どこにも無い id のレシピの URL は 404 になる", async ({
      page,
    }) => {
      for (const path of [
        "/recipes/not-a-recipe",
        "/recipes/00000000-0000-4000-8000-000000000000",
      ]) {
        await gotoHydrated(page, path);
        await expect(notFoundMessage(page)).toBeVisible();
      }
    });
  });

  test.describe("編集中に消されたレシピ", () => {
    const name = "E2E編集中削除レシピ";

    test.afterEach(async () => {
      await deleteRecipesStartingWith(name);
    });

    test("ui-tech §5: 編集の画面を開いている間に消されたレシピは、保存しても保存できたことにならず、画面に残る", async ({
      page,
    }) => {
      const id = await insertRecipe(name);
      await gotoHydrated(page, `/recipes/${id}`);
      await expect(visibleField(page, /レシピ名/)).toHaveValue(name);

      await markRecipeDeleted(id);
      await fillStable(page, /レシピ名/, `${name}改`);
      await page.getByRole("button", { name: "変更を保存" }).click();

      await expect(visibleText(page, "保存に失敗しました")).toBeVisible();
      await expect(page).toHaveURL(`/recipes/${id}`);
      expect(await recipeNamed(id)).toBe(name);
    });
  });
});
