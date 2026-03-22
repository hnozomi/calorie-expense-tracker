"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/hooks";

/** Section displaying account info and logout button */
const AccountSection = () => {
  const supabase = useSupabase();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
  }, [supabase]);

  /** Sign out and redirect to login */
  const handleSignOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Failed to sign out:", error);
      toast.error("ログアウトに失敗しました");
      return;
    }
    router.push("/login");
  }, [supabase, router]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">アカウント</h3>
      {email && <p className="text-sm text-muted-foreground">{email}</p>}
      <Button variant="outline" className="w-full" onClick={handleSignOut}>
        ログアウト
      </Button>
    </div>
  );
};

export { AccountSection };
