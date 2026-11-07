"use client";
// Client because the retry button is pressed in the browser

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onRetry: () => void;
  /** Buttons shown beside the retry button */
  children?: React.ReactNode;
};

export const LoadError = ({ onRetry, children }: Props) => {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
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
        <Button onClick={() => onRetry()}>再試行</Button>
        {children}
      </div>
    </div>
  );
};
