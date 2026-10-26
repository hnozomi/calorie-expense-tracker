import { execSync } from "node:child_process";
import { e2eUser, localSupabase } from "./local-supabase";

/** Start every run from the migrations alone. `db reset` also empties
 *  auth.users, so the E2E user is created after it */
const globalSetup = async () => {
  const { API_URL, SERVICE_ROLE_KEY } = localSupabase();
  execSync("supabase db reset --local", { stdio: "ignore" });

  const response = await fetch(`${API_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...e2eUser, email_confirm: true }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create the E2E user: ${await response.text()}`);
  }
};

export default globalSetup;
