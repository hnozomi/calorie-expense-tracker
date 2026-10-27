"use client";
// Client because tapping a tab switches the drawer's panel

import {
  BookOpen,
  Camera,
  Database,
  History,
  ListChecks,
  PenLine,
} from "lucide-react";
import { cn } from "@/utils";
import type { RegisterTab } from "../types/drawer-candidates";

const TABS = [
  { value: "manual", icon: PenLine, label: "手動" },
  { value: "recent", icon: History, label: "履歴" },
  { value: "recipe", icon: BookOpen, label: "レシピ" },
  { value: "food_master", icon: Database, label: "マスタ" },
  { value: "set_menu", icon: ListChecks, label: "セット" },
  { value: "ocr", icon: Camera, label: "OCR" },
] as const;

type Props = {
  activeTab: RegisterTab;
  onTabChange: (tab: RegisterTab) => void;
};

export const RegisterTabBar = ({ activeTab, onTabChange }: Props) => (
  <div className="shrink-0 px-4" role="tablist">
    <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
      {TABS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={activeTab === value}
          onClick={() => onTabChange(value)}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium transition-all",
            activeTab === value
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
);
