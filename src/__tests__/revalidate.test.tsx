import { useMutation } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Providers } from "@/app/providers";
import { revalidateApp } from "@/lib/revalidate";

const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const MutationButton = ({ shouldFail }: { shouldFail: boolean }) => {
  const mutation = useMutation({
    mutationFn: async () => {
      if (shouldFail) throw new Error("failed");
      return "ok";
    },
  });
  return (
    <>
      <button type="button" onClick={() => mutation.mutate()}>
        保存
      </button>
      {mutation.isSuccess && <p>保存した</p>}
      {mutation.isError && <p>失敗した</p>}
    </>
  );
};

describe("revalidateApp", () => {
  it("AC-R-6: re-reads every screen under the root layout", async () => {
    await revalidateApp();
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});

describe("Providers (legacy mutations)", () => {
  it("AC-R-6: a successful change on a screen still on TanStack Query re-reads the server-rendered screens", async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <MutationButton shouldFail={false} />
      </Providers>,
    );

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(await screen.findByText("保存した")).toBeInTheDocument();
    await waitFor(() =>
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout"),
    );
  });

  it("AC-R-6: a failed change does not re-read the screens", async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <MutationButton shouldFail />
      </Providers>,
    );

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(await screen.findByText("失敗した")).toBeInTheDocument();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
