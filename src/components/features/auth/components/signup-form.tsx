"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../hooks/use-auth";

const signupSchema = z.object({
  email: z.email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

/** Email/password signup form with validation */
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
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">めしログ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              ログイン画面に戻る
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center text-2xl">新規登録</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleSignup)} className="space-y-4">
          {serverError && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="mail@example.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "登録中..." : "アカウントを作成"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            既にアカウントをお持ちの方は
            <Link href="/login" className="ml-1 underline">
              ログイン
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export { SignupForm };
