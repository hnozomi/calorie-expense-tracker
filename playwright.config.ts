import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/** Load .env.local so E2E credentials are available to the test process */
const loadEnvLocal = () => {
  const envPath = path.join(__dirname, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
};
loadEnvLocal();

export default defineConfig({
  testDir: "./e2e",
  // Tests share one user account and mutate its data, so run serially
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    ...devices["Pixel 7"],
    // headless shell has no branded browser; keep defaults otherwise
  },
  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
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
    command: "NEXT_PUBLIC_E2E=1 pnpm dev",
    url: "http://localhost:3000/login",
    // Never reuse: a manually started server won't have NEXT_PUBLIC_E2E set
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
