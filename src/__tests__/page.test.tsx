import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

test("root page redirects to /home", async () => {
  const { redirect } = await import("next/navigation");
  const { default: RootPage } = await import("@/app/page");

  RootPage();

  expect(redirect).toHaveBeenCalledWith("/home");
});
