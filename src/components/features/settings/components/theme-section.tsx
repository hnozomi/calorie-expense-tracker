"use client";

import { Monitor, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/utils";

const THEME_OPTIONS = [
  { value: "system", label: "システム", icon: Monitor },
  { value: "light", label: "ライト", icon: Sun },
  { value: "dark", label: "ダーク", icon: Moon },
] as const;

/** Section for switching the app color theme (system / light / dark) */
const ThemeSection = () => {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  // Theme is unknown until after hydration; avoid a mismatched active state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section className="space-y-3">
      <SectionHeader icon={Palette} label="外観" />
      <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
        <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={isMounted && theme === value}
              onClick={() => setTheme(value)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium transition-all",
                isMounted && theme === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground/80",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export { ThemeSection };
