import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountSection } from "@/components/features/settings/components/account-section";

const signOut = vi.fn();
const getUser = vi.fn();

vi.mock("@/hooks", () => ({
  useSupabase: () => ({ auth: { signOut, getUser } }),
}));

const assign = vi.fn();
const postMessage = vi.fn();

beforeEach(() => {
  getUser.mockResolvedValue({
    data: { user: { email: "e2e@example.com" } },
  });
  vi.stubGlobal("location", { ...window.location, assign });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { controller: { postMessage } },
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const confirmLogout = async () => {
  const user = userEvent.setup();
  render(
    <>
      <AccountSection />
      <Toaster />
    </>,
  );
  await user.click(screen.getByRole("button", { name: "ログアウト" }));
  const dialog = await screen.findByRole("alertdialog", {
    name: "ログアウトしますか？",
  });
  await user.click(within(dialog).getByRole("button", { name: "ログアウト" }));
};

describe("AccountSection logout", () => {
  it("AC-R-9: after logging out the page is loaded again at /login instead of a client-side move", async () => {
    signOut.mockResolvedValue({ error: null });
    await confirmLogout();

    await waitFor(() => expect(assign).toHaveBeenCalledWith("/login"));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("AC-R-9: logging out asks the service worker to drop the cached pages that hold the user's data", async () => {
    signOut.mockResolvedValue({ error: null });
    await confirmLogout();

    await waitFor(() =>
      expect(postMessage).toHaveBeenCalledWith({ type: "CLEAR_CACHE" }),
    );
  });

  it("AC-R-9: without a service worker the logout still reloads at /login", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: undefined,
    });
    signOut.mockResolvedValue({ error: null });
    await confirmLogout();

    await waitFor(() => expect(assign).toHaveBeenCalledWith("/login"));
  });

  it("AC-R-9: when signing out fails the page stays, the cache is kept, and an error is shown", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    signOut.mockResolvedValue({ error: new Error("network") });
    await confirmLogout();

    expect(
      await screen.findByText("ログアウトに失敗しました"),
    ).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
    expect(postMessage).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "ログアウト" })).toBeEnabled();
  });

  it("AC-R-1: shows the signed-in email", async () => {
    render(<AccountSection />);
    expect(await screen.findByText("e2e@example.com")).toBeInTheDocument();
  });
});
