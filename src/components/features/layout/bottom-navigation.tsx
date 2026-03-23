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

/** Bottom tab navigation with glass background and active indicator pill */
const BottomNavigation = () => {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/80 backdrop-blur-lg",
        "border-t border-brand-border",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-w-[64px] flex-col items-center gap-0.5 px-3 py-2 text-xs",
                "transition-colors duration-150",
                "active:scale-90 active:opacity-70 transition-transform duration-100",
                isActive
                  ? "text-brand"
                  : "text-muted-foreground hover:text-brand/70",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-150",
                  isActive && "scale-110",
                )}
              />
              <span className="font-medium">{label}</span>
              {/* Active indicator pill */}
              {isActive && (
                <span className="absolute -bottom-1 h-[3px] w-5 rounded-full bg-brand" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export { BottomNavigation };
