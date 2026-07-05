"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold">エラーが発生しました</p>
        <p className="text-sm text-muted-foreground">
          時間をおいて再度お試しください。解決しない場合はアプリを再起動してください。
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>再試行</Button>
        <Button
          variant="outline"
          onClick={() => window.location.assign("/home")}
        >
          ホームに戻る
        </Button>
      </div>
    </div>
  );
}
