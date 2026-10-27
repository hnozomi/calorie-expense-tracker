import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditFormFooter } from "@/components/ui/edit-form-footer";

// The footer shared by the recipe, food master and set menu edit screens (S-05・S-08a・S-06a):
// the submit button, and on an edit the delete link that turns into the 02 delete confirm

afterEach(() => {
  cleanup();
});

type FooterProps = React.ComponentProps<typeof EditFormFooter>;

const renderFooter = (overrides: Partial<FooterProps> = {}) => {
  const handlers = {
    onDeleteAsk: vi.fn(),
    onDeleteCancel: vi.fn(),
    onDelete: vi.fn(),
  };
  render(
    <form>
      <EditFormFooter
        isNew={false}
        deleteLabel="このセットメニューを削除する"
        deleteDescription="過去の食事記録は影響を受けません。"
        isSaving={false}
        isDeleting={false}
        itemName="朝定食セット"
        isDeleteConfirmOpen={false}
        {...handlers}
        {...overrides}
      />
    </form>,
  );
  return handlers;
};

describe("EditFormFooter (詳細画面の保存と削除)", () => {
  it("S-06a: 新規のときは「登録する」の送信ボタンだけで、削除の操作は出さない", () => {
    renderFooter({ isNew: true });

    const submit = screen.getByRole("button", { name: /登録する/ });
    expect(submit).toHaveAttribute("type", "submit");
    expect(
      screen.queryByRole("button", { name: /削除する/ }),
    ).not.toBeInTheDocument();
  });

  it("S-06a: 編集のときは「変更を保存」の送信ボタンと、渡した文言の削除の操作を出す", () => {
    renderFooter();

    expect(screen.getByRole("button", { name: "変更を保存" })).toHaveAttribute(
      "type",
      "submit",
    );
    expect(
      screen.getByRole("button", { name: "このセットメニューを削除する" }),
    ).toBeInTheDocument();
  });

  it("02 ローディング: 保存している間は「保存中...」で押せない", () => {
    renderFooter({ isSaving: true });

    expect(screen.getByRole("button", { name: /保存中/ })).toBeDisabled();
  });

  it("02 削除確認: 削除の操作を押すと、確認を開くよう知らせる(まだ消さない)", async () => {
    const user = userEvent.setup();
    const handlers = renderFooter();

    await user.click(
      screen.getByRole("button", { name: "このセットメニューを削除する" }),
    );

    expect(handlers.onDeleteAsk).toHaveBeenCalledTimes(1);
    expect(handlers.onDelete).not.toHaveBeenCalled();
  });

  it("02 削除確認: 確認は「〇〇を削除しますか？」と渡した説明を出し、「削除する」で消し、「キャンセル」で閉じる", async () => {
    const user = userEvent.setup();
    const handlers = renderFooter({ isDeleteConfirmOpen: true });

    expect(
      screen.getByText("「朝定食セット」を削除しますか？"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("過去の食事記録は影響を受けません。"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(handlers.onDeleteCancel).toHaveBeenCalledTimes(1);
    expect(handlers.onDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "削除する" }));
    expect(handlers.onDelete).toHaveBeenCalledTimes(1);
  });

  it("02 ローディング: 削除している間は「削除中...」で押せない", () => {
    renderFooter({ isDeleteConfirmOpen: true, isDeleting: true });

    expect(screen.getByRole("button", { name: "削除中..." })).toBeDisabled();
  });
});
