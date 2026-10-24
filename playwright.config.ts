import { defineConfig, devices } from "@playwright/test";
import { localSupabase } from "./e2e/local-supabase";

const { API_URL, ANON_KEY } = localSupabase();
// A port of its own so a dev server on 3000 never answers for the E2E run
const port = 3101;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global.setup.ts",
  // Tests share one user account and mutate its data, so run serially
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    ...devices["Pixel 7"],
    // headless shell has no branded browser; keep defaults otherwise
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "e2e",
      dependencies: ["setup"],
      use: {
        ...devices["Pixel 7"],
        storageState: "e2e/.auth/user.json",
      },
    },
  ],
  webServer: {
    command: `pnpm next dev --turbopack --port ${port}`,
    url: `http://localhost:${port}/login`,
    // Never reuse: a manually started server won't have the E2E env below
    reuseExistingServer: false,
    timeout: 60_000,
    // process env wins over .env.local, so the app talks to local Supabase
    env: {
      NEXT_PUBLIC_E2E: "1",
      NEXT_PUBLIC_SUPABASE_URL: API_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON_KEY,
    },
  },
});
