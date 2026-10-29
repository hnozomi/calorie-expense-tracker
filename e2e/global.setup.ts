import { execSync } from "node:child_process";
import { localSupabase } from "./local-supabase";

// db reset restarts the containers; sign-in fails with a load error until Auth answers again
const waitForAuth = async (apiUrl: string, key: string) => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await fetch(`${apiUrl}/auth/v1/health`, {
      headers: { apikey: key },
    }).catch(() => undefined);
    if (response?.ok) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Local Supabase Auth did not answer within 60 seconds");
};

/** Start every run from the migrations and seed.sql, which also creates the E2E users */
const globalSetup = async () => {
  const { API_URL, SERVICE_ROLE_KEY } = localSupabase();
  execSync("supabase db reset --local", { stdio: "ignore" });
  await waitForAuth(API_URL, SERVICE_ROLE_KEY);
};

export default globalSetup;
