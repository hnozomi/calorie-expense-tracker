import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Header } from "@/components/features/layout/header";
import { PageContainer } from "@/components/features/layout/page-container";

// Mock next/navigation for BottomNavigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
}));

afterEach(() => {
  cleanup();
});

describe("Header", () => {
  it("renders the title", () => {
    render(<Header title="めしログ" />);
    expect(screen.getByText("めしログ")).toBeInTheDocument();
  });

  it("renders children as actions", () => {
    render(
      <Header title="テスト">
        <button type="button">アクション</button>
      </Header>,
    );
    expect(screen.getByText("テスト")).toBeInTheDocument();
    expect(screen.getByText("アクション")).toBeInTheDocument();
  });

  it("does not render actions wrapper when no children", () => {
    const { container } = render(<Header title="タイトル" />);
    const header = container.querySelector("header");
    expect(header?.children).toHaveLength(1);
  });

  it("applies custom className", () => {
    const { container } = render(
      <Header title="テスト" className="bg-red-500" />,
    );
    const header = container.querySelector("header");
    expect(header?.className).toContain("bg-red-500");
  });

  it("has sticky positioning", () => {
    const { container } = render(<Header title="テスト" />);
    const header = container.querySelector("header");
    expect(header?.className).toContain("sticky");
    expect(header?.className).toContain("top-0");
  });
});

describe("PageContainer", () => {
  it("renders children", () => {
    render(<PageContainer>コンテンツ</PageContainer>);
    expect(screen.getByText("コンテンツ")).toBeInTheDocument();
  });

  it("includes bottom padding for nav spacing", () => {
    const { container } = render(<PageContainer>テスト</PageContainer>);
    const main = container.querySelector("main");
    expect(main?.className).toContain("pb-20");
  });

  it("applies custom className", () => {
    const { container } = render(
      <PageContainer className="bg-blue-500">テスト</PageContainer>,
    );
    const main = container.querySelector("main");
    expect(main?.className).toContain("bg-blue-500");
  });
});

describe("BottomNavigation", () => {
  it("renders all 4 navigation items", async () => {
    const { BottomNavigation } = await import(
      "@/components/features/layout/bottom-navigation"
    );
    render(<BottomNavigation />);
    expect(screen.getByText("ホーム")).toBeInTheDocument();
    expect(screen.getByText("献立")).toBeInTheDocument();
    expect(screen.getByText("レシピ")).toBeInTheDocument();
    expect(screen.getByText("その他")).toBeInTheDocument();
  });

  it("renders links with correct hrefs", async () => {
    const { BottomNavigation } = await import(
      "@/components/features/layout/bottom-navigation"
    );
    render(<BottomNavigation />);
    const homeLink = screen.getByText("ホーム").closest("a");
    const planLink = screen.getByText("献立").closest("a");
    const recipesLink = screen.getByText("レシピ").closest("a");
    const otherLink = screen.getByText("その他").closest("a");
    expect(homeLink).toHaveAttribute("href", "/home");
    expect(planLink).toHaveAttribute("href", "/plan");
    expect(recipesLink).toHaveAttribute("href", "/recipes");
    expect(otherLink).toHaveAttribute("href", "/other");
  });

  it("highlights the active tab based on pathname", async () => {
    const { BottomNavigation } = await import(
      "@/components/features/layout/bottom-navigation"
    );
    render(<BottomNavigation />);
    const homeLink = screen.getByText("ホーム").closest("a");
    const planLink = screen.getByText("献立").closest("a");
    // /home is active (mocked pathname)
    expect(homeLink?.className).toContain("text-brand");
    expect(planLink?.className).toContain("text-muted-foreground");
  });
});
