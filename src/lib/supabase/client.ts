import { createBrowserClient } from "@supabase/ssr";

/** Create a Supabase client for browser-side usage */
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
};
