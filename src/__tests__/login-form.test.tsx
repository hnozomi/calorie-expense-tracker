import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/features/auth/components/login-form";

vi.mock("@/components/features/auth/hooks/use-auth", () => ({
  useAuth: () => ({ signIn: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  cleanup();
});

describe("LoginForm", () => {
  it("メールアドレスの欄には、最初からいつも使うアカウントのアドレスが入っている", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("メールアドレス")).toHaveValue(
      "app-user@example.com",
    );
    expect(screen.getByLabelText("パスワード")).toHaveValue("");
  });
});
