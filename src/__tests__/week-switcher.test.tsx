import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WeekSwitcher } from "@/components/ui/week-switcher";

// next/link is the framework boundary: record whether each link asks to be prefetched
vi.mock("next/link", () => ({
  default: ({
    href,
    prefetch,
    children,
    ...props
  }: {
    href: string;
    prefetch?: boolean | null;
    children: ReactNode;
  }) => (
    <a href={href} data-prefetch={String(prefetch)} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
});

const renderSwitcher = (isCurrentWeek: boolean) =>
  render(
    <WeekSwitcher
      label="10/12 〜 10/18"
      isCurrentWeek={isCurrentWeek}
      previousHref="/other/report?week=2026-10-05"
      nextHref="/other/report"
      currentWeekHref="/other/report"
    />,
  );

describe("WeekSwitcher (S-07・S-09 の前後の週)", () => {
  it("S-09: 前後の週への移動はリンクで、渡した URL へ移る(AC-R-3)", () => {
    renderSwitcher(false);

    expect(screen.getByRole("link", { name: "前の週" })).toHaveAttribute(
      "href",
      "/other/report?week=2026-10-05",
    );
    expect(screen.getByRole("link", { name: "次の週" })).toHaveAttribute(
      "href",
      "/other/report",
    );
  });

  it("ui-tech フェーズ3: 前後の週のリンクは先読み(prefetch)する", () => {
    renderSwitcher(false);

    expect(screen.getByRole("link", { name: "前の週" })).toHaveAttribute(
      "data-prefetch",
      "true",
    );
    expect(screen.getByRole("link", { name: "次の週" })).toHaveAttribute(
      "data-prefetch",
      "true",
    );
  });

  it("S-09: 週の範囲を出す", () => {
    renderSwitcher(false);

    expect(screen.getByText("10/12 〜 10/18")).toBeInTheDocument();
  });

  it("S-09: 今週を見ているときは「今週」と出し、「今週へ」は出さない", () => {
    renderSwitcher(true);

    expect(screen.getByText("今週")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "今週へ" }),
    ).not.toBeInTheDocument();
  });

  it("S-09: 今週でない週を見ているときは「今週へ」のリンクで今週の URL に戻れ、「今週」とは出さない", () => {
    renderSwitcher(false);

    expect(screen.getByRole("link", { name: "今週へ" })).toHaveAttribute(
      "href",
      "/other/report",
    );
    expect(screen.queryByText("今週")).not.toBeInTheDocument();
  });
});
