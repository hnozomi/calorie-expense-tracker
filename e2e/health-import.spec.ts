import { expect, request, test } from "@playwright/test";
import { gotoHydrated, todayInTokyo } from "./helpers";
import {
  e2eImportToken,
  e2eUser,
  serviceRoleRest,
  userIdOf,
} from "./local-supabase";

// The health import (phase 1 design ② 2-2): the sender posts with the token the seed registers for e2eUser and has
// no session of the app. The home band that shows the values comes in T-5, so until then this checks that the
// values reach the DB and that the home screen still shows (task T-4)

type HealthRow = {
  date: string;
  metric: string;
  source: string;
  value: number;
  measured_at: string | null;
};

const rowsOf = async (date: string): Promise<HealthRow[]> => {
  const userId = await userIdOf(e2eUser.email);
  const response = await serviceRoleRest(
    `health_daily_values?user_id=eq.${userId}&date=eq.${date}&select=date,metric,source,value,measured_at&order=metric`,
  );
  return (await response.json()) as HealthRow[];
};

const deleteRowsOf = async (date: string) => {
  const userId = await userIdOf(e2eUser.email);
  await serviceRoleRest(
    `health_daily_values?user_id=eq.${userId}&date=eq.${date}`,
    { method: "DELETE" },
  );
};

test.describe("健康データの取り込み口", () => {
  const today = todayInTokyo();

  test.afterEach(async () => {
    await deleteRowsOf(today);
  });

  test("T-4: seed のトークンで POST すると DB に入り、同じ内容の再送は changed: 0 で、ホームは壊れない", async ({
    page,
    baseURL,
  }) => {
    // No cookies: the sender is outside the app
    const sender = await request.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const body = {
      records: [
        {
          date: today,
          source: "withings",
          metrics: { weight_kg: 82.4, body_fat_pct: 21.3 },
          measured_at: `${today}T07:02:00+09:00`,
        },
        {
          date: today,
          source: "apple_health",
          metrics: { steps: 8214 },
        },
      ],
    };
    const post = () =>
      sender.post("/api/import/health-daily", {
        headers: { Authorization: `Bearer ${e2eImportToken}` },
        data: body,
      });

    const first = await post();
    expect(first.status()).toBe(200);
    expect(await first.json()).toEqual({ ok: true, received: 3, changed: 3 });

    const rows = await rowsOf(today);
    expect(
      rows.map(({ metric, source, value }) => ({ metric, source, value })),
    ).toEqual([
      { metric: "body_fat_pct", source: "withings", value: 21.3 },
      { metric: "steps", source: "apple_health", value: 8214 },
      { metric: "weight_kg", source: "withings", value: 82.4 },
    ]);
    const weight = rows.find((row) => row.metric === "weight_kg");
    expect(Date.parse(weight?.measured_at ?? "")).toBe(
      Date.parse(`${today}T07:02:00+09:00`),
    );

    const again = await post();
    expect(again.status()).toBe(200);
    expect(await again.json()).toEqual({ ok: true, received: 3, changed: 0 });
    expect(await rowsOf(today)).toHaveLength(3);

    await sender.dispose();

    await gotoHydrated(page, "/home");
    await expect(
      page.getByRole("region", { name: "朝食の記録" }),
    ).toBeVisible();
  });
});
