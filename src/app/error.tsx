"use client";

import { useEffect } from "react";
import { LoadError } from "@/components/features/layout";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <LoadError onRetry={retry}>
        <Button
          variant="outline"
          onClick={() => window.location.assign("/home")}
        >
          ホームに戻る
        </Button>
      </LoadError>
    </div>
  );
}
