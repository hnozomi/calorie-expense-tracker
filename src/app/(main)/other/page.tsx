"use client";

import {
  ChefHat,
  ChevronRight,
  ShoppingBasket,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { Header, PageContainer } from "@/components/features/layout";

const MENU_ITEMS = [
  {
    href: "/other/food-masters",
    label: "食品マスタ",
    description: "よく使う食品を管理",
    icon: ShoppingBasket,
  },
  {
    href: "/other/set-menus",
    label: "セットメニュー",
    description: "よく食べる組み合わせを管理",
    icon: UtensilsCrossed,
  },
] as const;

/** Other tab menu page */
export default function OtherPage() {
  return (
    <>
      <Header title="その他">
        <ChefHat className="h-5 w-5 text-muted-foreground" />
      </Header>
      <PageContainer>
        <div className="space-y-1 p-4">
          {MENU_ITEMS.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted"
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
