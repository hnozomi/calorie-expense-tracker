"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Utensils } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils";
import { useAuth } from "../hooks/use-auth";

const signupSchema = z.object({
  email: z.email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

/** Email/password signup form with branded header and validation */
const SignupForm = () => {
  const { signUp } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  /** Handle signup submission and display server errors or success */
  const handleSignup = async (values: SignupFormValues) => {
    setServerError(null);
    const { error } = await signUp(values.email, values.password);
    if (error) {
      if (error.message.includes("already registered")) {
        setServerError("このメールアドレスは既に登録されています");
      } else {
        setServerError("通信エラーが発生しました");
      }
    } else {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        {/* Branded header */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-md">
            <Utensils className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">めしログ</h1>
        </div>

        {/* Success card */}
        <Card className="w-full rounded-2xl border-0 shadow-lg shadow-black/5">
          <CardContent className="space-y-5 pt-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。
              </p>
            </div>
            <Link href="/login">
              <Button variant="outline" className="h-11 w-full font-semibold">
                ログイン画面に戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      {/* Signup card */}
      <Card className="w-full rounded-2xl border-0 shadow-lg shadow-black/5">
        <CardContent className="pt-6">
          <h2 className="mb-5 text-center text-lg font-semibold">
            新規アカウント作成
          </h2>
          <form onSubmit={handleSubmit(handleSignup)} className="space-y-5">
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
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
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
              {isSubmitting ? "登録中..." : "アカウントを作成"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              既にアカウントをお持ちの方は
              <Link
                href="/login"
                className="ml-1 font-medium text-brand underline-offset-4 hover:underline"
              >
                ログイン
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export { SignupForm };
