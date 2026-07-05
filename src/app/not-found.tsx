import { SearchX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold">ページが見つかりません</p>
        <p className="text-sm text-muted-foreground">
          URLが間違っているか、ページが削除された可能性があります。
        </p>
      </div>
      <Button asChild>
        <Link href="/home">ホームに戻る</Link>
      </Button>
    </div>
  );
}
