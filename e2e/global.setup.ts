import { expect, test as setup } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { loginViaUi } from "./helpers";

/** Wipe the dedicated E2E user's data so every run starts from a clean slate */
const wipeTestUserData = async () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await supabase.auth.signInWithPassword({
    email: process.env.E2E_EMAIL!,
    password: process.env.E2E_PASSWORD!,
  });
  if (error || !data.user) {
    throw new Error(`E2E user sign-in failed: ${error?.message}`);
  }

  const userId = data.user.id;
  // Parent tables only — children are CASCADE-deleted
  for (const table of [
    "meals",
    "meal_plans",
    "set_menus",
    "recipes",
    "food_masters",
    "user_settings",
  ] as const) {
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq("user_id", userId);
    if (deleteError) {
      throw new Error(`Failed to wipe ${table}: ${deleteError.message}`);
    }
  }
  await supabase.auth.signOut();
};

setup("authenticate", async ({ page }) => {
  await wipeTestUserData();

  await loginViaUi(page);
  await expect(page.getByText("朝食")).toBeVisible();

  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
