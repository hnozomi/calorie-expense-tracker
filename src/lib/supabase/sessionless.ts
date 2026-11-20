import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { AppDatabase } from "@/types";

/**
 * A Supabase client with the publishable key that neither reads nor keeps a session, so every call runs as anon.
 * For requests from outside the app (the health import), which carry no Supabase cookies: server.ts reads the
 * request's cookies and would act as whoever is signed in in that browser
 */
export const createSessionlessClient = () => {
  return createClient<AppDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
};
