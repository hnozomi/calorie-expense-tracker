import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InlineDeleteConfirm } from "@/components/ui/inline-delete-confirm";

afterEach(() => {
  cleanup();
});

const renderConfirm = (
  overrides: Partial<Parameters<typeof InlineDeleteConfirm>[0]> = {},
) => {
  const handlers = { onOpen: vi.fn(), onCancel: vi.fn(), onConfirm: vi.fn() };
  render(
    <InlineDeleteConfirm
      triggerLabel="このレシピを削除する"
      itemName="肉じゃが"
      description="過去の食事記録は影響を受けません。"
      isOpen={false}
      isDeleting={false}
      {...handlers}
      {...overrides}
    />,
  );
  return handlers;
};

describe("InlineDeleteConfirm", () => {
  it("02 削除確認: 閉じている間は削除の入口だけを出し、押すと開く", async () => {
    const { onOpen, onConfirm } = renderConfirm();

    expect(
      screen.queryByText("「肉じゃが」を削除しますか？"),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "このレシピを削除する" }),
    );

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("02 削除確認: 開くと「〇〇を削除しますか？」と説明、「キャンセル」と「削除する」を出す", () => {
    renderConfirm({ isOpen: true });

    expect(
      screen.getByText("「肉じゃが」を削除しますか？"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("過去の食事記録は影響を受けません。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "キャンセル" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "削除する" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "このレシピを削除する" }),
    ).not.toBeInTheDocument();
  });

  it("02 削除確認: 「削除する」で消し、「キャンセル」で閉じる", async () => {
    const { onCancel, onConfirm } = renderConfirm({ isOpen: true });

    await userEvent.click(screen.getByRole("button", { name: "削除する" }));
    await userEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("02 ローディング: 削除している間は「削除中...」になり、押せない", async () => {
    const { onConfirm } = renderConfirm({ isOpen: true, isDeleting: true });

    const deleting = screen.getByRole("button", { name: "削除中..." });
    expect(deleting).toBeDisabled();
    await userEvent.click(deleting);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("フォームの中に置いても、押してフォームを送信しない", async () => {
    const onSubmit = vi.fn((event: Event) => event.preventDefault());
    const handlers = { onOpen: vi.fn(), onCancel: vi.fn(), onConfirm: vi.fn() };
    render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent)}>
        <InlineDeleteConfirm
          triggerLabel="この食品を削除する"
          itemName="卵"
          description=""
          isOpen
          isDeleting={false}
          {...handlers}
        />
      </form>,
    );

    await userEvent.click(screen.getByRole("button", { name: "削除する" }));
    await userEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
