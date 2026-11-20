import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HealthImportSection } from "@/components/features/health/components/health-import-section";
import type {
  HealthImportSourceStatus,
  ImportTokenSummary,
} from "@/components/features/health/types/health-import";

// The settings section for the health import (phase 1 design 3-2, task T-6)

const issueImportToken = vi.fn();
const revokeImportToken = vi.fn();
vi.mock("@/components/features/health/api/actions", () => ({
  issueImportToken: (...args: unknown[]) => issueImportToken(...args),
  revokeImportToken: (...args: unknown[]) => revokeImportToken(...args),
}));

const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: (...args: unknown[]) => toastSuccess(...args),
  },
}));

const NO_IMPORT: HealthImportSourceStatus[] = [
  { source: "withings", lastImportedAt: null, latestDate: null },
  { source: "apple_health", lastImportedAt: null, latestDate: null },
];

const token = (
  id: string,
  overrides: Partial<ImportTokenSummary> = {},
): ImportTokenSummary => ({
  id,
  label: `ラベル${id}`,
  tokenPrefix: `mlg_${id.padEnd(4, "x")}`,
  createdAt: "2026-11-19T22:05:00Z",
  lastUsedAt: null,
  revokedAt: null,
  ...overrides,
});

const renderSection = (
  tokens: ImportTokenSummary[],
  status: HealthImportSourceStatus[] = NO_IMPORT,
) => render(<HealthImportSection status={status} tokens={tokens} />);

const tokenRow = (label: string) =>
  within(screen.getByRole("list", { name: "取り込みトークン" })).getByRole(
    "listitem",
    { name: label },
  );

beforeEach(() => {
  issueImportToken.mockReset();
  revokeImportToken.mockReset();
  toastError.mockReset();
  toastSuccess.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("取り込み状態", () => {
  it("T-6: 一度も取り込みが無ければ「まだ取り込みはありません」だけを出す", () => {
    renderSection([]);
    expect(screen.getByText("まだ取り込みはありません")).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "取り込み状態" }),
    ).not.toBeInTheDocument();
  });

  it("T-6: 出所ごとに最終取り込みと最新のデータを出し、まだ無い出所はそう書く", () => {
    renderSection(
      [],
      [
        {
          source: "withings",
          lastImportedAt: "2026-11-18T22:05:00Z",
          latestDate: "2026-11-19",
        },
        { source: "apple_health", lastImportedAt: null, latestDate: null },
      ],
    );
    const list = screen.getByRole("list", { name: "取り込み状態" });
    expect(
      within(list).getByRole("listitem", { name: "Withings" }),
    ).toHaveTextContent(
      "Withings体重・体脂肪率最終取り込み 11/19 07:05・最新のデータ 11/19",
    );
    expect(
      within(list).getByRole("listitem", { name: "Apple Health" }),
    ).toHaveTextContent("まだ取り込みはありません");
  });
});

describe("トークンの一覧", () => {
  it("T-6: ラベル・先頭・発行日・最後に使われた日時・状態を出す", () => {
    renderSection([
      token("a", {
        label: "もち",
        tokenPrefix: "mlg_7Kq2",
        lastUsedAt: "2026-11-20T21:30:00Z",
      }),
      token("b", { label: "古い", revokedAt: "2026-11-20T00:00:00Z" }),
    ]);

    const active = tokenRow("もち");
    expect(active).toHaveTextContent("有効");
    expect(active).toHaveTextContent("mlg_7Kq2…");
    expect(active).toHaveTextContent(
      "発行 2026/11/20・最終使用 2026/11/21 06:30",
    );
    expect(active).not.toHaveClass("opacity-60");

    const revoked = tokenRow("古い");
    expect(revoked).toHaveTextContent("失効");
    expect(revoked).toHaveTextContent("最終使用 未使用");
    expect(revoked).toHaveClass("opacity-60");
    // A revoked token cannot be revoked again from the screen
    expect(
      within(revoked).queryByRole("button", { name: "失効" }),
    ).not.toBeInTheDocument();
  });

  it("T-6: 失効を確かめて押すと、待たずに薄くなり「失効」になる", async () => {
    let resolveRevoke: (value: { ok: boolean }) => void = () => {};
    revokeImportToken.mockReturnValue(
      new Promise((resolve) => {
        resolveRevoke = resolve;
      }),
    );
    renderSection([token("a", { label: "もち" })]);

    await userEvent.click(
      within(tokenRow("もち")).getByRole("button", { name: "失効" }),
    );
    expect(screen.getByText("「もち」を失効しますか？")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "失効する" }));

    expect(revokeImportToken).toHaveBeenCalledWith("a");
    expect(tokenRow("もち")).toHaveClass("opacity-60");
    expect(within(tokenRow("もち")).getByText("失効")).toBeInTheDocument();

    resolveRevoke({ ok: true });
    await vi.waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(toastError).not.toHaveBeenCalled();
  });

  it("T-6: 失効に失敗したら有効に戻り、失敗を伝える", async () => {
    revokeImportToken.mockResolvedValue({ ok: false });
    renderSection([token("a", { label: "もち" })]);

    await userEvent.click(
      within(tokenRow("もち")).getByRole("button", { name: "失効" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "失効する" }));

    await vi.waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("トークンを失効できませんでした"),
    );
    expect(tokenRow("もち")).toHaveTextContent("有効");
    expect(tokenRow("もち")).not.toHaveClass("opacity-60");
  });

  it("T-6: キャンセルすると失効しない", async () => {
    renderSection([token("a", { label: "もち" })]);
    await userEvent.click(
      within(tokenRow("もち")).getByRole("button", { name: "失効" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(revokeImportToken).not.toHaveBeenCalled();
    expect(
      screen.queryByText("「もち」を失効しますか？"),
    ).not.toBeInTheDocument();
  });
});

describe("トークンの発行", () => {
  it("T-6: ラベルを入れて発行すると、平文をダイアログに出し、閉じると消える", async () => {
    const plain = "mlg_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG";
    issueImportToken.mockResolvedValue({ ok: true, token: plain });
    renderSection([]);

    await userEvent.click(
      screen.getByRole("button", { name: "トークンを発行" }),
    );
    await userEvent.type(screen.getByLabelText("ラベル"), " もち ");
    await userEvent.click(screen.getByRole("button", { name: "発行" }));

    expect(issueImportToken).toHaveBeenCalledWith({ label: "もち" });
    const shown = await screen.findByLabelText("発行したトークン");
    expect(shown).toHaveValue(plain);
    expect(
      screen.getByText(/この画面を閉じると二度と表示できません/),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "閉じる" }));
    expect(screen.queryByDisplayValue(plain)).not.toBeInTheDocument();

    // Opening the dialog again asks for a label; the token is not shown again
    await userEvent.click(
      screen.getByRole("button", { name: "トークンを発行" }),
    );
    expect(screen.getByLabelText("ラベル")).toHaveValue("");
    expect(screen.queryByLabelText("発行したトークン")).not.toBeInTheDocument();
  });

  it("T-6: ラベルが空なら発行せず、理由を出す", async () => {
    renderSection([]);
    await userEvent.click(
      screen.getByRole("button", { name: "トークンを発行" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "発行" }));
    expect(screen.getByText("ラベルを入力してください")).toBeInTheDocument();
    expect(issueImportToken).not.toHaveBeenCalled();
  });

  it("T-6: 発行に失敗したら平文を出さず、失敗を伝える", async () => {
    issueImportToken.mockResolvedValue({ ok: false });
    renderSection([]);
    await userEvent.click(
      screen.getByRole("button", { name: "トークンを発行" }),
    );
    await userEvent.type(screen.getByLabelText("ラベル"), "もち");
    await userEvent.click(screen.getByRole("button", { name: "発行" }));

    await vi.waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("トークンを発行できませんでした"),
    );
    expect(screen.queryByLabelText("発行したトークン")).not.toBeInTheDocument();
  });

  it("T-6: 有効なトークンが5件あると発行できず、理由を出す（失効したものは数えない）", () => {
    renderSection([
      ...["1", "2", "3", "4", "5"].map((id) => token(id)),
      token("6", { revokedAt: "2026-11-20T00:00:00Z" }),
    ]);
    expect(
      screen.getByRole("button", { name: "トークンを発行" }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        "有効なトークンは5件までです。不要なトークンを失効してから発行してください",
      ),
    ).toBeInTheDocument();
  });

  it("T-6: 4件なら発行でき、上限の文言は出ない", () => {
    renderSection(["1", "2", "3", "4"].map((id) => token(id)));
    expect(
      screen.getByRole("button", { name: "トークンを発行" }),
    ).toBeEnabled();
    expect(
      screen.queryByText(/有効なトークンは5件までです/),
    ).not.toBeInTheDocument();
  });
});
