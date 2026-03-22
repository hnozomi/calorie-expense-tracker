import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DangerZoneSection } from "@/components/features/settings/components/danger-zone-section";

/** Mock useDeleteAllData */
const mockDeleteAllData = vi.fn();
vi.mock("@/components/features/settings/hooks/use-delete-all-data", () => ({
  useDeleteAllData: () => ({
    isDeleting: false,
    deleteAllData: mockDeleteAllData,
  }),
}));

afterEach(() => {
  cleanup();
  mockDeleteAllData.mockClear();
});

describe("DangerZoneSection", () => {
  it("renders the danger zone title", () => {
    render(<DangerZoneSection />);
    expect(screen.getByText("危険ゾーン")).toBeInTheDocument();
  });

  it("renders the delete all data button", () => {
    render(<DangerZoneSection />);
    expect(screen.getByText("全データを削除")).toBeInTheDocument();
  });

  it("opens confirmation dialog on button click", async () => {
    const user = userEvent.setup();
    render(<DangerZoneSection />);
    await user.click(screen.getByText("全データを削除"));
    expect(
      screen.getByText("全データを削除しますか？"),
    ).toBeInTheDocument();
  });

  it("shows confirmation text input in dialog", async () => {
    const user = userEvent.setup();
    render(<DangerZoneSection />);
    await user.click(screen.getByText("全データを削除"));
    expect(
      screen.getByText(/「全データ削除」と入力してください/),
    ).toBeInTheDocument();
  });

  it("disables delete action when confirmation text is empty", async () => {
    const user = userEvent.setup();
    render(<DangerZoneSection />);
    await user.click(screen.getByText("全データを削除"));
    const deleteButton = screen.getByText("削除する");
    expect(deleteButton).toBeDisabled();
  });

  it("disables delete action when confirmation text is wrong", async () => {
    const user = userEvent.setup();
    render(<DangerZoneSection />);
    await user.click(screen.getByText("全データを削除"));
    await user.type(screen.getByPlaceholderText("全データ削除"), "間違いテキスト");
    const deleteButton = screen.getByText("削除する");
    expect(deleteButton).toBeDisabled();
  });

  it("enables delete action when correct confirmation text is typed", async () => {
    const user = userEvent.setup();
    render(<DangerZoneSection />);
    await user.click(screen.getByText("全データを削除"));
    await user.type(screen.getByPlaceholderText("全データ削除"), "全データ削除");
    const deleteButton = screen.getByText("削除する");
    expect(deleteButton).not.toBeDisabled();
  });

  it("calls deleteAllData when confirmed correctly", async () => {
    const user = userEvent.setup();
    render(<DangerZoneSection />);
    await user.click(screen.getByText("全データを削除"));
    await user.type(screen.getByPlaceholderText("全データ削除"), "全データ削除");
    await user.click(screen.getByText("削除する"));
    expect(mockDeleteAllData).toHaveBeenCalledTimes(1);
  });

  it("has cancel button in the dialog", async () => {
    const user = userEvent.setup();
    render(<DangerZoneSection />);
    await user.click(screen.getByText("全データを削除"));
    expect(screen.getByText("キャンセル")).toBeInTheDocument();
  });

  it("does not call deleteAllData when cancelled", async () => {
    const user = userEvent.setup();
    render(<DangerZoneSection />);
    await user.click(screen.getByText("全データを削除"));
    await user.click(screen.getByText("キャンセル"));
    expect(mockDeleteAllData).not.toHaveBeenCalled();
  });
});
