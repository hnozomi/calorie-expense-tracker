"use client";

import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
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
    <section className="space-y-3">
      <SectionHeader icon={User} label="アカウント" />
      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
        {email && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">ログイン中</p>
              <p className="truncate text-sm font-medium">{email}</p>
            </div>
          </div>
        )}
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </Button>
      </div>
    </section>
  );
};

export { AccountSection };
