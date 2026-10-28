"use client";
// Client because signing out clears the browser session

import { useState } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/hooks";
import { clearServiceWorkerCache } from "@/lib/service-worker";

export const useLogout = () => {
  const supabase = useSupabase();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    // local: the Auth project is shared by several apps, and the default (global) would sign this account
    // out of all of them and of every device (supabase.md)
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      console.error("Failed to sign out:", error);
      toast.error("ログアウトに失敗しました");
      setIsSigningOut(false);
      return;
    }
    clearServiceWorkerCache();
    // A full page load, not router.push: visited screens stay in the DOM (hidden) and the query cache
    // keeps their data until the page is loaded again, so the next user could see them
    window.location.assign("/login");
  };

  return { isSigningOut, handleSignOut };
};
