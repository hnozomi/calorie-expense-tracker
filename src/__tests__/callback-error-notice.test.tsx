import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CallbackErrorNotice } from "@/components/features/auth/components/callback-error-notice";

const searchParams = vi.hoisted(() => ({ current: new URLSearchParams() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams.current,
}));

afterEach(() => {
  cleanup();
});

describe("CallbackErrorNotice", () => {
  it("explains a failed confirmation link from ?error=confirmation_failed", () => {
    searchParams.current = new URLSearchParams("error=confirmation_failed");
    render(<CallbackErrorNotice />);

    expect(
      screen.getByText(
        "確認リンクが無効か期限切れです。ログインするか、新規登録をやり直してください",
      ),
    ).toBeInTheDocument();
  });

  it("shows nothing without ?error= or for an unknown one", () => {
    searchParams.current = new URLSearchParams("error=unknown");
    const { container } = render(<CallbackErrorNotice />);

    expect(container).toBeEmptyDOMElement();
  });
});
