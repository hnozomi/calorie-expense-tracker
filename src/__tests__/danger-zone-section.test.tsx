import { act, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DangerZoneSection } from "@/components/features/settings/components/danger-zone-section";
import { deferred } from "./helpers/daily-meals";
import { renderWithQueryClient } from "./helpers/query-client";

// Phase 5: deleting everything goes through the Server Action deleteAllData (the boundary here)
const deleteAllData = vi.fn();
vi.mock("@/components/features/settings/api/actions", () => ({
  deleteAllData: (...args: unknown[]) => deleteAllData(...args),
  saveNutritionTarget: vi.fn(),
  exportCsvRows: vi.fn(),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderSection = () => renderWithQueryClient(<DangerZoneSection />);

const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "全データを削除" }));
  return screen.findByRole("alertdialog", { name: /全データを削除しますか/ });
};

const confirmField = () => screen.getByPlaceholderText("全データ削除");
const deleteButton = () => screen.getByRole("button", { name: "削除する" });

/** Wait until the action's result has been handled (the transition ended) */
const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

describe("DangerZoneSection (S-10 全データを削除)", () => {
  it("S-10: 「危険ゾーン」の見出しを出す", () => {
    renderSection();
    expect(screen.getByText("危険ゾーン")).toBeInTheDocument();
  });

  it("S-10: 「全データを削除」のボタンを出す", () => {
    renderSection();
    expect(
      screen.getByRole("button", { name: "全データを削除" }),
    ).toBeInTheDocument();
  });

  it("S-10: ボタンを押すと確認のダイアログが開く", async () => {
    const user = userEvent.setup();
    renderSection();
    expect(await openDialog(user)).toBeInTheDocument();
  });

  it("S-10: ダイアログに「全データ削除」と入力するよう案内と入力欄を出す", async () => {
    const user = userEvent.setup();
    renderSection();
    await openDialog(user);
    expect(
      screen.getByText(/「全データ削除」と入力してください/),
    ).toBeInTheDocument();
    expect(confirmField()).toHaveValue("");
  });

  it("ui.md 入力: 確認の入力欄には、ブラウザの入力候補を出さない", async () => {
    const user = userEvent.setup();
    renderSection();
    await openDialog(user);
    expect(confirmField()).toHaveAttribute("autocomplete", "off");
  });

  it("S-10: 何も入力していなければ「削除する」を押せない", async () => {
    const user = userEvent.setup();
    renderSection();
    await openDialog(user);
    expect(deleteButton()).toBeDisabled();
  });

  it("S-10: 違う文字を入力しても「削除する」を押せない", async () => {
    const user = userEvent.setup();
    renderSection();
    await openDialog(user);
    await user.type(confirmField(), "間違いテキスト");
    expect(deleteButton()).toBeDisabled();
  });

  it("S-10: 「全データ削除」と入力すると「削除する」を押せる", async () => {
    const user = userEvent.setup();
    renderSection();
    await openDialog(user);
    await user.type(confirmField(), "全データ削除");
    expect(deleteButton()).toBeEnabled();
  });

  it("S-10: 正しく入力して「削除する」を押すと、全データを1回だけ削除し、知らせてダイアログを閉じる", async () => {
    deleteAllData.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderSection();
    await openDialog(user);
    await user.type(confirmField(), "全データ削除");
    await user.click(deleteButton());
    await flush();

    expect(deleteAllData).toHaveBeenCalledTimes(1);
    expect(toastSuccess).toHaveBeenCalledWith("全データを削除しました");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("S-10: ダイアログに「キャンセル」がある", async () => {
    const user = userEvent.setup();
    renderSection();
    await openDialog(user);
    expect(
      screen.getByRole("button", { name: "キャンセル" }),
    ).toBeInTheDocument();
  });

  it("S-10: キャンセルすると削除しない", async () => {
    const user = userEvent.setup();
    renderSection();
    await openDialog(user);
    await user.type(confirmField(), "全データ削除");
    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(deleteAllData).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("02 ローディング: 削除している間は「削除中...」で押せず、二重に送らない", async () => {
    const pending = deferred<{ ok: boolean }>();
    deleteAllData.mockReturnValue(pending.promise);
    const user = userEvent.setup();
    renderSection();
    await openDialog(user);
    await user.type(confirmField(), "全データ削除");
    await user.click(deleteButton());

    const deleting = await screen.findByRole("button", { name: "削除中..." });
    expect(deleting).toBeDisabled();
    await user.click(deleting);
    expect(deleteAllData).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve({ ok: true });
    });
    await flush();
  });

  it("AC-R-5: 削除に失敗すると、エラーを出してダイアログを開いたままにし、もう一度押せる", async () => {
    deleteAllData.mockResolvedValue({ ok: false });
    const user = userEvent.setup();
    renderSection();
    await openDialog(user);
    await user.type(confirmField(), "全データ削除");
    await user.click(deleteButton());
    await flush();

    expect(toastError).toHaveBeenCalledWith(
      expect.stringContaining("データの削除に失敗しました"),
    );
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(confirmField()).toHaveValue("全データ削除");
    expect(deleteButton()).toBeEnabled();
  });

  it("AC-R-5: 呼び出しそのものが失敗しても(通信が切れた など)、エラーを出してダイアログを開いたままにする", async () => {
    deleteAllData.mockRejectedValue(new TypeError("Failed to fetch"));
    const user = userEvent.setup();
    renderSection();
    await openDialog(user);
    await user.type(confirmField(), "全データ削除");
    await user.click(deleteButton());
    await flush();

    expect(toastError).toHaveBeenCalledWith(
      expect.stringContaining("データの削除に失敗しました"),
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("S-10: 開き直すと、前に入力した文字は消えていて、また入力しないと押せない", async () => {
    const user = userEvent.setup();
    renderSection();
    await openDialog(user);
    await user.type(confirmField(), "全データ削除");
    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    await openDialog(user);

    expect(confirmField()).toHaveValue("");
    expect(deleteButton()).toBeDisabled();
  });
});
