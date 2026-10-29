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

/** Created by supabase/seed.sql on every `supabase db reset`. The same in every app */
export const e2eUser = {
  email: "e2e@example.com",
  password: "e2e-password",
};

/** Two users of their own for the logout flow: signing out revokes every session of that user,
 *  so the shared e2eUser must not be the one that logs out mid-run */
export const e2eSwitchUsers = {
  previous: { email: "e2e-previous@example.com", password: "e2e-password" },
  next: { email: "e2e-next@example.com", password: "e2e-password" },
};

/** Call the local REST API as the service role, for test data that bypasses RLS */
export const serviceRoleRest = async (
  path: string,
  init: RequestInit = {},
): Promise<Response> => {
  const { API_URL, SERVICE_ROLE_KEY } = localSupabase();
  const response = await fetch(`${API_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(
      `${init.method ?? "GET"} ${path}: ${await response.text()}`,
    );
  }
  return response;
};

/** Look up a user's id by email through the admin API */
export const userIdOf = async (email: string): Promise<string> => {
  const { API_URL, SERVICE_ROLE_KEY } = localSupabase();
  const response = await fetch(`${API_URL}/auth/v1/admin/users?per_page=100`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  const { users } = (await response.json()) as {
    users: { id: string; email: string }[];
  };
  const user = users.find((candidate) => candidate.email === email);
  if (!user) throw new Error(`No E2E user ${email}`);
  return user.id;
};
