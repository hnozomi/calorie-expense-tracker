import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BottomNavigationView } from "@/components/features/layout/bottom-navigation";

const TABS = [
  { name: "ホーム", href: "/home" },
  { name: "献立", href: "/plan" },
  { name: "レシピ", href: "/recipes" },
  { name: "その他", href: "/other" },
] as const;

afterEach(() => {
  cleanup();
});

// Same signal the existing BottomNavigation test uses: the active tab gets the brand color
const isHighlighted = (name: string) =>
  screen
    .getByRole("link", { name })
    .className.split(/\s+/)
    .includes("text-brand");

const highlightedTabs = () =>
  TABS.map(({ name }) => name).filter((name) => isHighlighted(name));

describe("BottomNavigationView", () => {
  it("AC-R-1: shows the four tabs as links to their screens", () => {
    render(<BottomNavigationView pathname="/home" />);
    for (const { name, href } of TABS) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });

  it("AC-R-1: while the path is unknown (pathname omitted) no tab is selected", () => {
    render(<BottomNavigationView />);
    expect(highlightedTabs()).toEqual([]);
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
    expect(highlightedTabs()).toEqual([name]);
  });

  it.each([
    ["/recipes/new", "レシピ"],
    ["/other/food-masters/abc", "その他"],
    ["/other/settings", "その他"],
  ])("AC-R-1: on a screen under a tab (%s) the %s tab is selected", (pathname, name) => {
    render(<BottomNavigationView pathname={pathname} />);
    expect(highlightedTabs()).toEqual([name]);
  });

  it("AC-R-1: a path that only starts with the same letters does not select the tab", () => {
    render(<BottomNavigationView pathname="/homepage" />);
    expect(highlightedTabs()).toEqual([]);
  });

  it("AC-R-1: a screen outside the tabs (/login) selects no tab", () => {
    render(<BottomNavigationView pathname="/login" />);
    expect(highlightedTabs()).toEqual([]);
  });
});
