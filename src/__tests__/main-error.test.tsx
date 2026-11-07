import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import MainError from "@/app/(main)/error";

describe("タブのある画面のエラー", () => {
  it("再試行を押すと、読み直しを頼む", async () => {
    const retry = vi.fn();
    render(<MainError retry={retry} />);

    expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "再試行" }));

    expect(retry).toHaveBeenCalledOnce();
  });
});
