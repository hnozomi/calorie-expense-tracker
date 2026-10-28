"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/** Provide sign-in/sign-up/sign-out actions for the auth forms */
export const useAuth = () => {
  // createBrowserClient returns one shared client per browser tab
  const supabase = createClient();
  const router = useRouter();

  const signUp = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      return { error };
    },
    [supabase],
  );

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

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [supabase, router]);

  return { signUp, signIn, signOut };
};
