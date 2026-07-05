import { WifiOff } from "lucide-react";

/** Fallback page served by the Service Worker when offline */
export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <WifiOff className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold">オフラインです</p>
        <p className="text-sm text-muted-foreground">
          インターネット接続を確認して、もう一度お試しください。
        </p>
      </div>
    </div>
  );
}
