"use client";
// Client because signing out clears the browser session

import { LogOut, User } from "lucide-react";
import { useLogout } from "@/components/features/settings/hooks/use-logout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";

type Props = {
  /** Read on the server */
  email: string | null;
};

export const AccountSection = ({ email }: Props) => {
  const { isSigningOut, handleSignOut } = useLogout();

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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={isSigningOut}
            >
              <LogOut className="h-4 w-4" />
              {isSigningOut ? "ログアウト中..." : "ログアウト"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ログアウトしますか？</AlertDialogTitle>
              <AlertDialogDescription>
                再度利用するにはログインが必要になります。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleSignOut}>
                ログアウト
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
};
