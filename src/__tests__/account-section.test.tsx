import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountSection } from "@/components/features/settings/components/account-section";

const push = vi.fn();
const refresh = vi.fn();
const signOut = vi.fn();
const getUser = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/hooks", () => ({
  useSupabase: () => ({ auth: { getUser, signOut } }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AccountSection", () => {
  it("signs out only this device's session and moves to the login page", async () => {
    getUser.mockResolvedValue({ data: { user: { email: "me@example.com" } } });
    signOut.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<AccountSection />);

    await user.click(screen.getByRole("button", { name: "ログアウト" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "ログアウト",
      }),
    );

    // Auth is shared with other apps, so the default global scope would sign them out too
    await waitFor(() =>
      expect(signOut).toHaveBeenCalledExactlyOnceWith({ scope: "local" }),
    );
    expect(push).toHaveBeenCalledWith("/login");
  });
});
