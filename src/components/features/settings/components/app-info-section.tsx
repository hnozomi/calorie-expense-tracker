"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Section displaying app version and cache management */
const AppInfoSection = () => {
  /** Clear Service Worker caches */
  const handleClearCache = useCallback(async () => {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      toast.success("キャッシュをクリアしました");
    } else {
      toast.error("キャッシュクリアに対応していないブラウザです");
    }
  }, []);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">アプリ情報</h3>
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>めしログ v1.0.0</p>
        <p>毎日の食事をサクッと記録</p>
      </div>
      <Button variant="outline" className="w-full" onClick={handleClearCache}>
        キャッシュをクリア
      </Button>
    </div>
  );
};

export { AppInfoSection };
