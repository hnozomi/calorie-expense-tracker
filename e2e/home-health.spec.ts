import { execSync } from "node:child_process";
import { expect, type Page, test } from "@playwright/test";
import { gotoHydrated, visibleText } from "./helpers";
import {
  e2eUser,
  localSupabase,
  serviceRoleRest,
  userIdOf,
} from "./local-supabase";

// The home band of health values (phase 1 design 3-1, task T-5). Values are put in as the service role, which
// can write the automatic sources the app's own users cannot. Days of their own, apart from the other specs

const VALUE_DAY = "2020-03-10";
const EMPTY_DAY = "2020-03-20";
const FAIL_DAY = "2020-03-30";

const insertValues = async (
  records: { date: string; metric: string; source: string; value: number }[],
) => {
  const userId = await userIdOf(e2eUser.email);
  await serviceRoleRest("health_daily_values", {
    method: "POST",
    body: JSON.stringify(
      records.map((record) => ({ ...record, user_id: userId })),
    ),
  });
};

const deleteValuesBetween = async (from: string, to: string) => {
  const userId = await userIdOf(e2eUser.email);
  await serviceRoleRest(
    `health_daily_values?user_id=eq.${userId}&date=gte.${from}&date=lte.${to}`,
    { method: "DELETE" },
  );
};

// The server reads the band, so the browser cannot make that read fail; taking the privilege away in the local
// DB makes the query itself fail (42501) the way a real DB error would
const setHealthSelectGrant = (granted: boolean) => {
  localSupabase();
  execSync(
    `supabase db query --local '${granted ? "GRANT" : "REVOKE"} SELECT ON TABLE public.health_daily_values ${granted ? "TO" : "FROM"} authenticated'`,
    { stdio: "ignore" },
  );
};

const band = (page: Page) =>
  page.getByRole("region", { name: "健康データ" }).filter({ visible: true });

test.describe("ホームの健康データの帯", () => {
  test.beforeAll(async () => {
    await deleteValuesBetween("2020-03-01", "2020-03-31");
    await insertValues([
      { date: VALUE_DAY, metric: "weight_kg", source: "withings", value: 82.4 },
      { date: VALUE_DAY, metric: "weight_kg", source: "manual", value: 90 },
      {
        date: VALUE_DAY,
        metric: "body_fat_pct",
        source: "withings",
        value: 21.3,
      },
      { date: VALUE_DAY, metric: "steps", source: "apple_health", value: 8214 },
      {
        date: "2020-03-09",
        metric: "weight_kg",
        source: "withings",
        value: 82.7,
      },
      { date: FAIL_DAY, metric: "weight_kg", source: "withings", value: 81 },
    ]);
  });

  test.afterAll(async () => {
    setHealthSelectGrant(true);
    await deleteValuesBetween("2020-03-01", "2020-03-31");
  });

  test("T-5: 値がある日は、体重・前日比・体脂肪・歩数が出る", async ({
    page,
  }) => {
    await gotoHydrated(page, `/home?date=${VALUE_DAY}`);
    await expect(band(page)).toHaveText(
      "体重 82.4kg（前日比 −0.3）・体脂肪 21.3%・歩数 8,214",
    );
  });

  test("T-5: 取り込みの無い日は「未取得」が出る", async ({ page }) => {
    await gotoHydrated(page, `/home?date=${EMPTY_DAY}`);
    await expect(band(page)).toHaveText(
      "体重 未取得・体脂肪 未取得・歩数 未取得",
    );
  });

  test("T-5: 健康データの読み込みに失敗しても、帯に「—」が出て、ホームの残りは出る", async ({
    page,
  }) => {
    setHealthSelectGrant(false);
    try {
      await gotoHydrated(page, `/home?date=${FAIL_DAY}`);
      await expect(band(page)).toHaveText("体重 —・体脂肪 —・歩数 —");
      await expect(
        page.getByRole("region", { name: "朝食の記録" }),
      ).toBeVisible();
      // The summary card's cost of the day (no meals on this day)
      await expect(visibleText(page, "¥0", { exact: true })).toBeVisible();
    } finally {
      setHealthSelectGrant(true);
    }
  });
});
