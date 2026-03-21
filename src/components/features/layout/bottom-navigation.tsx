"use client";

import {
  CalendarDays,
  Home,
  MoreHorizontal,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils";

const NAV_ITEMS = [
  { href: "/home", label: "ホーム", icon: Home },
  { href: "/plan", label: "献立", icon: CalendarDays },
  { href: "/recipes", label: "レシピ", icon: UtensilsCrossed },
  { href: "/other", label: "その他", icon: MoreHorizontal },
] as const;

/** Bottom tab navigation for mobile PWA */
const BottomNavigation = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-[64px] flex-col items-center gap-0.5 px-3 py-2 text-xs",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export { BottomNavigation };
