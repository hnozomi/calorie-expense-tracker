import { createHash, randomBytes } from "node:crypto";
import { expect, type Page, request, test } from "@playwright/test";
import { gotoHydrated, todayInTokyo } from "./helpers";
import {
  e2eImportToken,
  e2eUser,
  serviceRoleRest,
  userIdOf,
} from "./local-supabase";

// The health import section of the settings screen (phase 1 design 3-2, task T-6). The seed gives e2eUser one token
// that is not revoked (label E2E), and it counts toward the limit of 5. Tokens these tests add are labelled T6-…
// and removed after each test, so the seed token is the only one left between tests

const LABEL_PREFIX = "T6-";

// See food-masters.spec.ts: in development the private caches are kept per cookies and headers, so each test
// gets a cache of its own and reads the rows it put straight into the DB
test.beforeEach(async ({ page }, testInfo) => {
  await page.setExtraHTTPHeaders({ "x-e2e-test-id": testInfo.testId });
});

test.afterEach(async () => {
  const userId = await userIdOf(e2eUser.email);
  await serviceRoleRest(
    `import_tokens?user_id=eq.${userId}&label=like.${encodeURIComponent(`${LABEL_PREFIX}*`)}`,
    { method: "DELETE" },
  );
  await serviceRoleRest(
    `health_daily_values?user_id=eq.${userId}&date=eq.${todayInTokyo()}`,
    { method: "DELETE" },
  );
});

const section = (page: Page) =>
  page.getByRole("region", { name: "健康データの取り込み" });

const tokenRow = (page: Page, label: string) =>
  section(page)
    .getByRole("list", { name: "取り込みトークン" })
    .getByRole("listitem", { name: label });

/** The sender of the health import: outside the app, with no session */
const postHealthImport = async (baseURL: string | undefined, token: string) => {
  const sender = await request.newContext({
    baseURL,
    storageState: { cookies: [], origins: [] },
  });
  const response = await sender.post("/api/import/health-daily", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      records: [
        {
          date: todayInTokyo(),
          source: "withings",
          metrics: { weight_kg: 82.4 },
        },
      ],
    },
  });
  const status = response.status();
  await sender.dispose();
  return status;
};

/** M/D HH:mm in Tokyo, as the screen shows a time it read from the DB */
const tokyoMonthDayTime = (iso: string): string => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
};

const monthDay = (date: string): string => {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
};

test.describe("設定: 健康データの取り込み", () => {
  test("T-6: 発行すると mlg_ で始まる値が1回だけ出て、閉じると一覧に先頭だけが出る。失効するとそのトークンでの POST が 401 になる", async ({
    page,
    baseURL,
  }) => {
    const label = `${LABEL_PREFIX}発行`;
    await gotoHydrated(page, "/other/settings");

    await section(page).getByRole("button", { name: "トークンを発行" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("ラベル").fill(label);
    await dialog.getByRole("button", { name: "発行" }).click();

    const shown = dialog.getByRole("textbox", { name: "発行したトークン" });
    await expect(shown).toHaveValue(/^mlg_[A-Za-z0-9_-]{43}$/);
    const plain = await shown.inputValue();
    await expect(
      dialog.getByText(/この画面を閉じると二度と表示できません/),
    ).toBeVisible();

    // The new token works before it is revoked
    expect(await postHealthImport(baseURL, plain)).toBe(200);

    await dialog.getByRole("button", { name: "閉じる" }).click();
    await expect(dialog).toBeHidden();

    const row = tokenRow(page, label);
    await expect(row).toContainText("有効");
    await expect(row).toContainText(`${plain.slice(0, 8)}…`);
    // The plain token is nowhere on the page once the dialog is closed
    await expect(page.locator("body")).not.toContainText(plain);

    // Opening the dialog again asks for a label; the token is not shown again
    await section(page).getByRole("button", { name: "トークンを発行" }).click();
    await expect(page.getByRole("dialog").getByLabel("ラベル")).toHaveValue("");
    await expect(
      page.getByRole("textbox", { name: "発行したトークン" }),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();

    await row.getByRole("button", { name: "失効" }).click();
    await expect(row.getByText(`「${label}」を失効しますか？`)).toBeVisible();
    await row.getByRole("button", { name: "失効する" }).click();

    await expect(row).toContainText("失効");
    await expect(row).not.toContainText("有効");
    await expect(row.getByRole("button", { name: "失効" })).toHaveCount(0);
    await expect(page.getByText("トークンを失効しました")).toBeVisible();

    expect(await postHealthImport(baseURL, plain)).toBe(401);

    // Still revoked after the screen is read again
    await gotoHydrated(page, "/other/settings");
    await expect(tokenRow(page, label)).toContainText("失効");
  });

  test("T-6: 取り込みの後は、出所ごとの最終取り込みの日時と最新のデータの日付が出る", async ({
    page,
    baseURL,
  }) => {
    const userId = await userIdOf(e2eUser.email);
    // Other specs remove the health rows they add; this makes sure no import is left before the empty state
    await serviceRoleRest(`health_daily_values?user_id=eq.${userId}`, {
      method: "DELETE",
    });
    await gotoHydrated(page, "/other/settings");
    await expect(
      section(page).getByText("まだ取り込みはありません"),
    ).toBeVisible();

    expect(await postHealthImport(baseURL, e2eImportToken)).toBe(200);

    const [newest] = (await (
      await serviceRoleRest(
        `health_daily_values?user_id=eq.${userId}&source=eq.withings&select=imported_at&order=imported_at.desc&limit=1`,
      )
    ).json()) as { imported_at: string }[];
    const [latest] = (await (
      await serviceRoleRest(
        `health_daily_values?user_id=eq.${userId}&source=eq.withings&select=date&order=date.desc&limit=1`,
      )
    ).json()) as { date: string }[];

    // A cache of its own again: the import cannot reach the cache the screen above was read into
    await page.setExtraHTTPHeaders({
      "x-e2e-test-id": `${test.info().testId}-after-import`,
    });
    await gotoHydrated(page, "/other/settings");

    const withings = section(page)
      .getByRole("list", { name: "取り込み状態" })
      .getByRole("listitem", { name: "Withings" });
    await expect(withings).toContainText(
      `最終取り込み ${tokyoMonthDayTime(newest?.imported_at ?? "")}・最新のデータ ${monthDay(latest?.date ?? "")}`,
    );
    // The seed token was the one used, so it now has a last-used time
    await expect(tokenRow(page, "E2E")).not.toContainText("未使用");
  });

  test("T-6: 有効なトークンが seed の1件を含めて5件あると発行できず、理由が出る。1件失効すると発行できる", async ({
    page,
  }) => {
    const userId = await userIdOf(e2eUser.email);
    // With the seed token these make 5. Only hashes are stored, so random values stand in for real tokens
    await serviceRoleRest("import_tokens", {
      method: "POST",
      body: JSON.stringify(
        [1, 2, 3, 4].map((n) => ({
          user_id: userId,
          label: `${LABEL_PREFIX}上限${n}`,
          token_hash: createHash("sha256")
            .update(randomBytes(32))
            .digest("hex"),
          token_prefix: "mlg_TEST",
        })),
      ),
    });

    await gotoHydrated(page, "/other/settings");
    const issue = section(page).getByRole("button", { name: "トークンを発行" });
    const limitMessage = section(page).getByText(
      "有効なトークンは5件までです。不要なトークンを失効してから発行してください",
    );
    await expect(issue).toBeDisabled();
    await expect(limitMessage).toBeVisible();

    const row = tokenRow(page, `${LABEL_PREFIX}上限1`);
    await row.getByRole("button", { name: "失効" }).click();
    await row.getByRole("button", { name: "失効する" }).click();

    await expect(limitMessage).toBeHidden();
    await expect(issue).toBeEnabled();
  });
});
