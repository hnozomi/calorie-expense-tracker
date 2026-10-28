import { act, cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CsvExportSection } from "@/components/features/settings/components/csv-export-section";
import { NutritionTargetSection } from "@/components/features/settings/components/nutrition-target-section";
import type { NutritionTarget } from "@/types";
import { deferred } from "./helpers/daily-meals";
import { renderWithQueryClient } from "./helpers/query-client";

// The Server Actions, the toast and the browser's file download are the boundary here

const saveNutritionTarget = vi.fn();
const exportCsvRows = vi.fn();
vi.mock("@/components/features/settings/api/actions", () => ({
  saveNutritionTarget: (...args: unknown[]) => saveNutritionTarget(...args),
  exportCsvRows: (...args: unknown[]) => exportCsvRows(...args),
  deleteAllData: vi.fn(),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
const toastInfo = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
    info: (...args: unknown[]) => toastInfo(...args),
  },
}));

const downloadCsv = vi.fn();
vi.mock("@/utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  downloadCsv: (...args: unknown[]) => downloadCsv(...args),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

/** Wait until the action's result has been handled (the transition ended) */
const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const target: NutritionTarget = {
  id: "settings-1",
  userId: "user-1",
  targetCalories: 2000,
  targetProtein: 100,
  targetFat: 60,
  targetCarbs: 250,
};

const caloriesField = () => screen.getByLabelText("カロリー (kcal)");
const proteinField = () => screen.getByLabelText("P (g)");
const fatField = () => screen.getByLabelText("F (g)");
const carbsField = () => screen.getByLabelText("C (g)");
const saveButton = () => screen.getByRole("button", { name: "保存" });

describe("NutritionTargetSection (S-10 1日の目標)", () => {
  it("AC-R-2: サーバーで読んだ目標値が、4つの欄に入っている", () => {
    renderWithQueryClient(<NutritionTargetSection target={target} />);

    expect(caloriesField()).toHaveValue(2000);
    expect(proteinField()).toHaveValue(100);
    expect(fatField()).toHaveValue(60);
    expect(carbsField()).toHaveValue(250);
  });

  it("ui.md 入力: 4つの欄は数の入力(小数可)で、キーボードの決定は「完了」", () => {
    renderWithQueryClient(<NutritionTargetSection target={target} />);

    for (const field of [
      caloriesField(),
      proteinField(),
      fatField(),
      carbsField(),
    ]) {
      expect(field).toHaveAttribute("type", "number");
      expect(field).toHaveAttribute("inputmode", "decimal");
      expect(field).toHaveAttribute("enterkeyhint", "done");
    }
  });

  it("ST-2・AC-R-6: 保存すると打った値を数で送り、「目標値を保存しました」と知らせる", async () => {
    saveNutritionTarget.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderWithQueryClient(<NutritionTargetSection target={target} />);

    await user.clear(caloriesField());
    await user.type(caloriesField(), "1800");
    await user.clear(carbsField());
    await user.type(carbsField(), "212.5");
    await user.click(saveButton());
    await flush();

    expect(saveNutritionTarget).toHaveBeenCalledWith({
      targetCalories: 1800,
      targetProtein: 100,
      targetFat: 60,
      targetCarbs: 212.5,
    });
    expect(toastSuccess).toHaveBeenCalledWith("目標値を保存しました");
    expect(caloriesField()).toHaveValue(1800);
  });

  it("ST-1: カロリーに負の数を入れて保存すると、欄の下に「1以上で入力してください」が出て保存しない", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<NutritionTargetSection target={target} />);

    await user.clear(caloriesField());
    await user.type(caloriesField(), "-100");
    await user.click(saveButton());

    expect(caloriesField()).toHaveAccessibleDescription(
      "1以上で入力してください",
    );
    expect(caloriesField()).toHaveAttribute("aria-invalid", "true");
    expect(saveNutritionTarget).not.toHaveBeenCalled();
  });

  it("02 バリデーション: 空の欄は「入力してください」、上限を超えた欄は上限を出し、正しい欄にはエラーを出さない", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<NutritionTargetSection target={target} />);

    await user.clear(proteinField());
    await user.clear(fatField());
    await user.type(fatField(), "1001");
    await user.click(saveButton());

    expect(proteinField()).toHaveAccessibleDescription("入力してください");
    expect(fatField()).toHaveAccessibleDescription(
      "1,000以下で入力してください",
    );
    expect(caloriesField()).not.toHaveAttribute("aria-invalid", "true");
    expect(carbsField()).not.toHaveAttribute("aria-invalid", "true");
    expect(saveNutritionTarget).not.toHaveBeenCalled();
  });

  it("02 バリデーション: 直して保存し直すと、前のエラーは消える", async () => {
    saveNutritionTarget.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderWithQueryClient(<NutritionTargetSection target={target} />);

    await user.clear(caloriesField());
    await user.type(caloriesField(), "0");
    await user.click(saveButton());
    expect(caloriesField()).toHaveAttribute("aria-invalid", "true");

    await user.clear(caloriesField());
    await user.type(caloriesField(), "1500");
    await user.click(saveButton());
    await flush();

    expect(caloriesField()).not.toHaveAttribute("aria-invalid", "true");
    expect(
      screen.queryByText("1以上で入力してください"),
    ).not.toBeInTheDocument();
    expect(saveNutritionTarget).toHaveBeenCalledTimes(1);
  });

  it("AC-R-5: 保存に失敗すると「保存に失敗しました」を出し、打った値を消さない", async () => {
    saveNutritionTarget.mockResolvedValue({ ok: false });
    const user = userEvent.setup();
    renderWithQueryClient(<NutritionTargetSection target={target} />);

    await user.clear(caloriesField());
    await user.type(caloriesField(), "1700");
    await user.click(saveButton());
    await flush();

    expect(toastError).toHaveBeenCalledWith("保存に失敗しました");
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(caloriesField()).toHaveValue(1700);
    expect(saveButton()).toBeEnabled();
  });

  it("AC-R-5: 呼び出しそのものが失敗しても(通信が切れた など)、「保存に失敗しました」を出す", async () => {
    saveNutritionTarget.mockRejectedValue(new TypeError("Failed to fetch"));
    const user = userEvent.setup();
    renderWithQueryClient(<NutritionTargetSection target={target} />);

    await user.click(saveButton());
    await flush();

    expect(toastError).toHaveBeenCalledWith("保存に失敗しました");
  });

  it("02 ローディング: 保存している間は「保存中...」で押せず、二重に送らない", async () => {
    const pending = deferred<{ ok: boolean }>();
    saveNutritionTarget.mockReturnValue(pending.promise);
    const user = userEvent.setup();
    renderWithQueryClient(<NutritionTargetSection target={target} />);

    await user.click(saveButton());

    const saving = await screen.findByRole("button", { name: "保存中..." });
    expect(saving).toBeDisabled();
    await user.click(saving);
    expect(saveNutritionTarget).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve({ ok: true });
    });
    await flush();
  });
});

const exportButton = (name: string) => screen.getByRole("button", { name });

describe("CsvExportSection (S-10 CSV エクスポート)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-27T03:00:00Z"));
  });

  it("S-10: 4種類(食事記録・レシピ・食品マスタ・セットメニュー)を個別にダウンロードできる", async () => {
    exportCsvRows.mockResolvedValue({
      ok: true,
      rows: [{ name: "カレー", servings: 2 }],
    });
    const user = userEvent.setup();
    renderWithQueryClient(<CsvExportSection />);

    for (const [label, type] of [
      ["食事記録", "meals"],
      ["レシピ", "recipes"],
      ["食品マスタ", "food_masters"],
      ["セットメニュー", "set_menus"],
    ]) {
      await user.click(exportButton(label));
      await flush();
      expect(exportCsvRows).toHaveBeenLastCalledWith(
        expect.objectContaining({ type }),
      );
    }
    expect(downloadCsv).toHaveBeenCalledTimes(4);
  });

  it("S-10: レシピの CSV は、見出し付きの中身を日付入りのファイル名で保存し、成功を知らせる", async () => {
    exportCsvRows.mockResolvedValue({
      ok: true,
      rows: [
        {
          name: "カレー",
          servings: 2,
          calories: 1200,
          protein: 40,
          fat: 30,
          carbs: 160,
          notes: null,
        },
      ],
    });
    const user = userEvent.setup();
    renderWithQueryClient(<CsvExportSection />);

    await user.click(exportButton("レシピ"));
    await flush();

    expect(exportCsvRows).toHaveBeenCalledWith({
      type: "recipes",
      period: "all",
    });
    const [content, filename] = downloadCsv.mock.calls[0] as [string, string];
    expect(content).toContain("レシピ名");
    expect(content).toContain("カレー");
    expect(filename).toMatch(/^meshilog_recipes_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(toastSuccess).toHaveBeenCalledWith("レシピをエクスポートしました");
  });

  it("S-10: 食事記録は選んだ期間(今月・先月)で読み、ほかの3種類は期間を問わず全部を読む", async () => {
    exportCsvRows.mockResolvedValue({ ok: true, rows: [{ name: "x" }] });
    const user = userEvent.setup();
    renderWithQueryClient(<CsvExportSection />);

    expect(screen.getByRole("button", { name: "全期間" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "先月" }));
    expect(screen.getByRole("button", { name: "先月" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(exportButton("食事記録"));
    await flush();
    expect(exportCsvRows).toHaveBeenLastCalledWith({
      type: "meals",
      period: "last_month",
    });

    await user.click(exportButton("食品マスタ"));
    await flush();
    expect(exportCsvRows).toHaveBeenLastCalledWith({
      type: "food_masters",
      period: "all",
    });
  });

  it("02 空状態: 0件のときはファイルを作らず「エクスポートするデータがありません」と知らせる", async () => {
    exportCsvRows.mockResolvedValue({ ok: true, rows: [] });
    const user = userEvent.setup();
    renderWithQueryClient(<CsvExportSection />);

    await user.click(exportButton("セットメニュー"));
    await flush();

    expect(downloadCsv).not.toHaveBeenCalled();
    expect(toastInfo).toHaveBeenCalledWith(
      "エクスポートするデータがありません",
    );
  });

  it("AC-R-5: 読めなかったときは「エクスポートに失敗しました」を出し、ファイルを作らない", async () => {
    exportCsvRows.mockResolvedValue({ ok: false });
    const user = userEvent.setup();
    renderWithQueryClient(<CsvExportSection />);

    await user.click(exportButton("食品マスタ"));
    await flush();

    expect(toastError).toHaveBeenCalledWith("エクスポートに失敗しました");
    expect(downloadCsv).not.toHaveBeenCalled();
    expect(exportButton("食品マスタ")).toBeEnabled();
  });

  it("AC-R-5: 呼び出しそのものが失敗しても、「エクスポートに失敗しました」を出す", async () => {
    exportCsvRows.mockRejectedValue(new TypeError("Failed to fetch"));
    const user = userEvent.setup();
    renderWithQueryClient(<CsvExportSection />);

    await user.click(exportButton("食事記録"));
    await flush();

    expect(toastError).toHaveBeenCalledWith("エクスポートに失敗しました");
  });

  it("02 ローディング: 書き出している間は押した種類が「エクスポート中...」になり、4つとも押せない", async () => {
    const pending = deferred<{ ok: boolean; rows: unknown[] }>();
    exportCsvRows.mockReturnValue(pending.promise);
    const user = userEvent.setup();
    renderWithQueryClient(<CsvExportSection />);

    await user.click(exportButton("レシピ"));

    expect(
      await screen.findByRole("button", { name: "エクスポート中..." }),
    ).toBeDisabled();
    for (const name of ["食事記録", "食品マスタ", "セットメニュー"]) {
      expect(exportButton(name)).toBeDisabled();
    }

    await act(async () => {
      pending.resolve({ ok: true, rows: [] });
    });
    await flush();
    expect(exportButton("レシピ")).toBeEnabled();
  });
});
