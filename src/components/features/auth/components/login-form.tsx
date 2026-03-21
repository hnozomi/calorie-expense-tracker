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

const loginSchema = z.object({
  email: z.email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/** Email/password login form with validation */
const LoginForm = () => {
  const { signIn } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const handleLogin = async (values: LoginFormValues) => {
    setServerError(null);
    const { error } = await signIn(values.email, values.password);
    if (error) {
      setServerError("メールアドレスまたはパスワードが正しくありません");
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center text-2xl">めしログ</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
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
              autoComplete="current-password"
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
            {isSubmitting ? "ログイン中..." : "ログイン"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            アカウントをお持ちでない方は
            <Link href="/signup" className="ml-1 underline">
              新規登録
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export { LoginForm };
