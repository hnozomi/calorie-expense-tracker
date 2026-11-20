import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsContent } from "@/components/features/settings/components/settings-content";

// Phase 5 replaced SettingsView (a client view reading through TanStack Query) with SettingsContent, a server part
// that reads the targets and the email and hands them to the sections. The DB reads and the Server Actions are the
// boundary; the sections themselves are real

const getNutritionTarget = vi.fn();
const getAccountEmail = vi.fn();
vi.mock("@/components/features/settings/api/queries", () => ({
  getNutritionTarget: () => getNutritionTarget(),
  getAccountEmail: () => getAccountEmail(),
}));

// T-6 added the health import status and the import tokens to the same Promise.all; they are DB reads too
const getHealthImportStatus = vi.fn();
const getImportTokens = vi.fn();
vi.mock("@/components/features/health/api/queries", () => ({
  getHealthImportStatus: () => getHealthImportStatus(),
  getImportTokens: () => getImportTokens(),
}));

vi.mock("@/components/features/health/api/actions", () => ({
  issueImportToken: vi.fn(),
  revokeImportToken: vi.fn(),
}));

vi.mock("@/components/features/settings/api/actions", () => ({
  saveNutritionTarget: vi.fn(),
  deleteAllData: vi.fn(),
  exportCsvRows: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: vi.fn() } }),
}));

beforeEach(() => {
  getNutritionTarget.mockResolvedValue({
    id: "settings-1",
    userId: "user-1",
    targetCalories: 1800,
    targetProtein: 90,
    targetFat: 50,
    targetCarbs: 230,
  });
  getAccountEmail.mockResolvedValue("e2e@example.com");
  getHealthImportStatus.mockResolvedValue([
    { source: "withings", lastImportedAt: null, latestDate: null },
    { source: "apple_health", lastImportedAt: null, latestDate: null },
  ]);
  getImportTokens.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const renderContent = async () => render(await SettingsContent());

describe("SettingsContent (S-10 設定)", () => {
  it("AC-R-2: 1日の目標の欄に、サーバーで読んだ目標値が最初から入っている", async () => {
    await renderContent();

    expect(screen.getByLabelText("カロリー (kcal)")).toHaveValue(1800);
    expect(screen.getByLabelText("P (g)")).toHaveValue(90);
    expect(screen.getByLabelText("F (g)")).toHaveValue(50);
    expect(screen.getByLabelText("C (g)")).toHaveValue(230);
    expect(getNutritionTarget).toHaveBeenCalledTimes(1);
  });

  it("AC-R-2: アカウントに、サーバーで読んだログイン中のメールが出る", async () => {
    await renderContent();

    expect(screen.getByText("e2e@example.com")).toBeInTheDocument();
    expect(getAccountEmail).toHaveBeenCalledTimes(1);
  });

  it("S-10: メールが読めないとき(null)は、メールの行を出さずにログアウトだけ出す", async () => {
    getAccountEmail.mockResolvedValue(null);

    await renderContent();

    expect(screen.queryByText("ログイン中")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ログアウト" }),
    ).toBeInTheDocument();
  });

  it("S-10: CSV エクスポートに、食事記録・レシピ・食品マスタ・セットメニューの4つのボタンが出る", async () => {
    await renderContent();

    for (const name of ["食事記録", "レシピ", "食品マスタ", "セットメニュー"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("S-10: 危険ゾーンに「全データを削除」が出る", async () => {
    await renderContent();

    expect(screen.getByText("危険ゾーン")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "全データを削除" }),
    ).toBeInTheDocument();
  });

  it("T-6: 1日の目標の下に「健康データの取り込み」を出し、状態とトークンを読む", async () => {
    await renderContent();

    const section = screen.getByRole("region", {
      name: "健康データの取り込み",
    });
    expect(section).toBeInTheDocument();
    // The target field comes before the section, and is not inside it
    expect(
      section.compareDocumentPosition(screen.getByLabelText("カロリー (kcal)")),
    ).toBe(Node.DOCUMENT_POSITION_PRECEDING);
    expect(getHealthImportStatus).toHaveBeenCalledTimes(1);
    expect(getImportTokens).toHaveBeenCalledTimes(1);
  });
});
