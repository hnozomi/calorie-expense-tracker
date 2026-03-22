"use client";

import { Info, Trash2 } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";

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
    <section className="space-y-3">
      <SectionHeader icon={Info} label="アプリ情報" />
      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">めしログ</p>
            <p className="text-xs text-muted-foreground">
              毎日の食事をサクッと記録
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            v1.0.0
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleClearCache}
        >
          <Trash2 className="h-4 w-4" />
          キャッシュをクリア
        </Button>
      </div>
    </section>
  );
};

export { AppInfoSection };
