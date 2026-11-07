import { createBrowserClient } from "@supabase/ssr";
import type { AppDatabase } from "@/types";

/** Create a Supabase client for browser-side usage */
export const createClient = () => {
  return createBrowserClient<AppDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
};
