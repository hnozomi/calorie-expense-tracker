import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BottomNavigationView } from "@/components/features/layout/bottom-navigation-view";

const TABS = [
  { name: "ホーム", href: "/home" },
  { name: "献立", href: "/plan" },
  { name: "レシピ", href: "/recipes" },
  { name: "その他", href: "/other" },
] as const;

afterEach(() => {
  cleanup();
});

// The selected tab is the one link marked aria-current="page"; every other tab has no aria-current
const expectSelectedTab = (selected: string | null) => {
  for (const { name } of TABS) {
    const link = screen.getByRole("link", { name });
    if (name === selected) {
      expect(link).toHaveAttribute("aria-current", "page");
    } else {
      expect(link).not.toHaveAttribute("aria-current");
    }
  }
};

describe("BottomNavigationView", () => {
  it("AC-R-1: shows the four tabs as links to their screens", () => {
    render(<BottomNavigationView pathname="/home" />);
    for (const { name, href } of TABS) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });

  it("AC-R-1: while the path is unknown (pathname omitted) no tab is selected", () => {
    render(<BottomNavigationView />);
    expectSelectedTab(null);
    for (const { name } of TABS) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href");
    }
  });

  it.each([
    ["/home", "ホーム"],
    ["/plan", "献立"],
    ["/recipes", "レシピ"],
    ["/other", "その他"],
  ])("AC-R-1: on %s only the %s tab is selected", (pathname, name) => {
    render(<BottomNavigationView pathname={pathname} />);
    expectSelectedTab(name);
  });

  it.each([
    ["/recipes/new", "レシピ"],
    ["/other/food-masters/abc", "その他"],
    ["/other/settings", "その他"],
  ])("AC-R-1: on a screen under a tab (%s) the %s tab is selected", (pathname, name) => {
    render(<BottomNavigationView pathname={pathname} />);
    expectSelectedTab(name);
  });

  it("AC-R-1: a path that only starts with the same letters does not select the tab", () => {
    render(<BottomNavigationView pathname="/homepage" />);
    expectSelectedTab(null);
  });

  it("AC-R-1: a screen outside the tabs (/login) selects no tab", () => {
    render(<BottomNavigationView pathname="/login" />);
    expectSelectedTab(null);
  });
});
