import { execSync } from "node:child_process";

type LocalSupabaseStatus = {
  API_URL: string;
  ANON_KEY: string;
  SERVICE_ROLE_KEY: string;
};

/** Connection details of the running local Supabase. E2E rewrites the DB, so refuse anything that is not local */
export const localSupabase = (): LocalSupabaseStatus => {
  let status: LocalSupabaseStatus;
  try {
    status = JSON.parse(
      execSync("supabase status -o json", {
        stdio: ["ignore", "pipe", "ignore"],
      }).toString(),
    );
  } catch {
    throw new Error(
      "Local Supabase is not running. Run `supabase start` before the E2E tests",
    );
  }
  const { hostname } = new URL(status.API_URL);
  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error(
      `E2E must only run against local Supabase: ${status.API_URL}`,
    );
  }
  return status;
};

/** Created fresh by global.setup.ts after every `supabase db reset` */
export const e2eUser = {
  email: "e2e@example.com",
  password: "e2e-password",
};
