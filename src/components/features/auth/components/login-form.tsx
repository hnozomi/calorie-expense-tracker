"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthError } from "@supabase/supabase-js";
import { AlertCircle, MailWarning, Utensils } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, PasswordInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils";
import { useAuth } from "../hooks/use-auth";

const loginSchema = z.object({
  email: z.email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/** User-facing messages for known Supabase auth error codes */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "メールアドレスまたはパスワードが正しくありません",
  email_not_confirmed:
    "メールアドレスの確認が完了していません。登録時に届いた確認メールのリンクをクリックしてください",
  over_request_rate_limit:
    "試行回数が多すぎます。しばらく時間をおいてから再度お試しください",
};

/** Messages for errors passed back from the auth callback route */
const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  confirmation_failed:
    "確認リンクが無効か期限切れです。ログインするか、新規登録をやり直してください",
};

/** Resolve a sign-in failure to a specific Japanese message */
const resolveLoginErrorMessage = (error: AuthError): string => {
  if (error.code && AUTH_ERROR_MESSAGES[error.code]) {
    return AUTH_ERROR_MESSAGES[error.code];
  }
  if (error.status === 400) {
    return AUTH_ERROR_MESSAGES.invalid_credentials;
  }
  return "ログインに失敗しました。通信環境を確認して再度お試しください";
};

/** Email/password login form with branded header and validation */
const LoginForm = () => {
  const { signIn } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackErrorKey = searchParams.get("error");
  const callbackError = callbackErrorKey
    ? (CALLBACK_ERROR_MESSAGES[callbackErrorKey] ?? null)
    : null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  /** Handle login submission and display server errors */
  const handleLogin = async (values: LoginFormValues) => {
    setServerError(null);
    const { error } = await signIn(values.email, values.password);
    if (error) {
      setServerError(resolveLoginErrorMessage(error));
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      {/* Branded header */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-md">
          <Utensils className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">めしログ</h1>
        <p className="text-sm text-muted-foreground">
          カロリー＆食費をかんたん記録
        </p>
      </div>

      {/* Login card */}
      <Card className="w-full rounded-2xl border-0 shadow-lg shadow-black/5">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
            {callbackError && !serverError && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3">
                <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {callbackError}
                </p>
              </div>
            )}
            {serverError && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{serverError}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="mail@example.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                className={cn(
                  "h-11 transition-colors",
                  errors.email &&
                    "border-destructive focus-visible:ring-destructive",
                )}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                className={cn(
                  "h-11 transition-colors",
                  errors.password &&
                    "border-destructive focus-visible:ring-destructive",
                )}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="h-11 w-full bg-brand font-semibold text-brand-foreground shadow-sm hover:bg-brand/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "ログイン中..." : "ログイン"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              アカウントをお持ちでない方は
              <Link
                href="/signup"
                className="ml-1 font-medium text-brand underline-offset-4 hover:underline"
              >
                新規登録
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export { LoginForm };
