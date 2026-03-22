"use client";

import {
  BarChart3,
  ChefHat,
  ChevronRight,
  Settings,
  ShoppingBasket,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { Header, PageContainer } from "@/components/features/layout";
import { cn } from "@/utils";

const MENU_ITEMS = [
  {
    href: "/other/food-masters",
    label: "食品マスタ",
    description: "よく使う食品を管理",
    icon: ShoppingBasket,
    badgeColor: "bg-emerald-100 text-emerald-600",
  },
  {
    href: "/other/set-menus",
    label: "セットメニュー",
    description: "よく食べる組み合わせを管理",
    icon: UtensilsCrossed,
    badgeColor: "bg-brand-muted text-brand",
  },
  {
    href: "/other/report",
    label: "ウィークリーレポート",
    description: "週間の記録を振り返る",
    icon: BarChart3,
    badgeColor: "bg-blue-100 text-blue-600",
  },
  {
    href: "/other/settings",
    label: "設定",
    description: "アカウント・データ管理",
    icon: Settings,
    badgeColor: "bg-slate-100 text-slate-500",
  },
] as const;

/** Other tab menu page with card-style navigation items */
export default function OtherPage() {
  return (
    <>
      <Header title="その他">
        <ChefHat className="h-5 w-5 text-muted-foreground" />
      </Header>
      <PageContainer>
        <div className="space-y-3 p-4">
          {MENU_ITEMS.map(
            ({ href, label, description, icon: Icon, badgeColor }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4",
                  "shadow-sm transition-all duration-200",
                  "hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
                )}
              >
                {/* Icon badge with colored background circle */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    badgeColor,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
              </Link>
            ),
          )}
        </div>
      </PageContainer>
    </>
  );
}
