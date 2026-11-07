"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/** Provide the sign-in action for the login form */
export const useAuth = () => {
  // createBrowserClient returns one shared client per browser tab
  const supabase = createClient();
  const router = useRouter();

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error) {
        router.push("/home");
        router.refresh();
      }
      return { error };
    },
    [supabase, router],
  );

  return { signIn };
};
