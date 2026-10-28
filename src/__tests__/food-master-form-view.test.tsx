import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Activity } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FoodMasterFormView } from "@/components/features/food-masters/components/food-master-form-view";
import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import { deferred } from "./helpers/daily-meals";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
}));

const saveFoodMaster = vi.fn();
const deleteFoodMaster = vi.fn();
vi.mock("@/components/features/food-masters/api/actions", () => ({
  saveFoodMaster: (...args: unknown[]) => saveFoodMaster(...args),
  deleteFoodMaster: (...args: unknown[]) => deleteFoodMaster(...args),
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

const MASTER_ID = "3f1c2b4a-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const LIST_PATH = "/other/food-masters";

const createFoodMaster = (overrides: Partial<FoodMaster> = {}): FoodMaster => ({
  id: MASTER_ID,
  userId: "user-1",
  name: "サラダチキン",
  brand: "セブンイレブン",
  category: null,
  calories: 110,
  protein: 23.8,
  fat: 1.2,
  carbs: 0.3,
  defaultPrice: 298,
  notes: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const user = () => userEvent.setup();

const nameField = () => screen.getByLabelText(/食品名/);
const brandField = () => screen.getByLabelText("ブランド");
const caloriesField = () => screen.getByLabelText(/カロリー/);
const proteinField = () => screen.getByLabelText("P (g)");
const categoryField = () => screen.getByRole("combobox", { name: "カテゴリ" });
/** The header's back arrow, an icon-only button named by aria-label */
const backButton = () =>
  within(screen.getByRole("banner")).getByRole("button", {
    name: "食品マスタの一覧に戻る",
  });

const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

describe("FoodMasterFormView (S-08a 食品マスタ登録/編集)", () => {
  describe("新規", () => {
    it("S-08a: 新規の画面は「食品を登録」で、入力は空、削除の操作は無い", () => {
      render(<FoodMasterFormView prefill={{}} />);

      expect(
        screen.getByRole("heading", { name: "食品を登録" }),
      ).toBeInTheDocument();
      expect(nameField()).toHaveValue("");
      expect(
        screen.queryByRole("button", { name: /この食品を削除する/ }),
      ).not.toBeInTheDocument();
    });

    it("S-08a: OCR から渡された値(prefill)が、新規の画面の入力に入っている", () => {
      render(
        <FoodMasterFormView
          prefill={{ name: "プロテインバー", calories: 200, protein: 15 }}
        />,
      );

      expect(nameField()).toHaveValue("プロテインバー");
      expect(caloriesField()).toHaveValue(200);
      expect(proteinField()).toHaveValue(15);
    });

    it("S-08a: OCR から渡された値は、そのまま登録できる", async () => {
      saveFoodMaster.mockResolvedValue({ ok: true });
      const u = user();
      render(
        <FoodMasterFormView
          prefill={{ name: "プロテインバー", calories: 200 }}
        />,
      );

      await u.click(screen.getByRole("button", { name: /登録する/ }));
      await flush();

      const [input] = saveFoodMaster.mock.calls[0] as [
        { id?: string; values: Record<string, unknown> },
      ];
      expect(input.id).toBeUndefined();
      expect(input.values).toMatchObject({
        name: "プロテインバー",
        calories: 200,
      });
    });

    it("AC-R-5: 登録に成功すると、成功を知らせて食品マスタの一覧に移る", async () => {
      saveFoodMaster.mockResolvedValue({ ok: true });
      const u = user();
      render(<FoodMasterFormView prefill={{}} />);

      await u.type(nameField(), "ゆで卵");
      await u.type(brandField(), "ローソン");
      await u.clear(caloriesField());
      await u.type(caloriesField(), "70");
      await u.click(screen.getByRole("button", { name: /登録する/ }));
      await flush();

      const [input] = saveFoodMaster.mock.calls[0] as [
        { id?: string; values: Record<string, unknown> },
      ];
      expect(input.id).toBeUndefined();
      expect(input.values).toMatchObject({
        name: "ゆで卵",
        brand: "ローソン",
        calories: 70,
      });
      expect(toastSuccess).toHaveBeenCalledWith("食品を登録しました");
      expect(push).toHaveBeenCalledWith(LIST_PATH);
    });

    it("02 バリデーション: 食品名が空のまま登録すると、欄の下にエラーが出て保存しない", async () => {
      const u = user();
      render(<FoodMasterFormView prefill={{}} />);

      await u.click(screen.getByRole("button", { name: /登録する/ }));

      expect(
        await screen.findByText("食品名を入力してください"),
      ).toBeInTheDocument();
      expect(saveFoodMaster).not.toHaveBeenCalled();
    });

    it("02 バリデーション: マイナスのカロリーでは保存しない", async () => {
      const u = user();
      render(<FoodMasterFormView prefill={{}} />);

      await u.type(nameField(), "ゆで卵");
      await u.clear(caloriesField());
      await u.type(caloriesField(), "-1");
      await u.click(screen.getByRole("button", { name: /登録する/ }));

      expect(
        await screen.findByText("0以上で入力してください"),
      ).toBeInTheDocument();
      expect(saveFoodMaster).not.toHaveBeenCalled();
    });

    it("02 バリデーション: エラーの文は欄に結び付き(aria-describedby)、欄はエラーの状態(aria-invalid)になる", async () => {
      const u = user();
      render(<FoodMasterFormView prefill={{}} />);
      expect(nameField()).not.toHaveAttribute("aria-invalid", "true");

      await u.clear(caloriesField());
      await u.type(caloriesField(), "-1");
      await u.clear(proteinField());
      await u.type(proteinField(), "-1");
      await u.type(screen.getByLabelText(/価格/), "-1");
      await u.click(screen.getByRole("button", { name: /登録する/ }));

      await waitFor(() =>
        expect(nameField()).toHaveAccessibleDescription(
          "食品名を入力してください",
        ),
      );
      expect(nameField()).toHaveAttribute("aria-invalid", "true");
      for (const field of [
        caloriesField(),
        proteinField(),
        screen.getByLabelText(/価格/),
      ]) {
        expect(field).toHaveAccessibleDescription("0以上で入力してください");
        expect(field).toHaveAttribute("aria-invalid", "true");
      }
      expect(screen.getByLabelText("F (g)")).not.toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(saveFoodMaster).not.toHaveBeenCalled();
    });

    it("S-08a: カテゴリは「カテゴリ」の欄で選べ、選んだカテゴリで登録する", async () => {
      saveFoodMaster.mockResolvedValue({ ok: true });
      const u = user();
      render(<FoodMasterFormView prefill={{}} />);

      await u.type(nameField(), "メロンパン");
      await u.click(categoryField());
      await u.click(await screen.findByRole("option", { name: "パン" }));
      expect(categoryField()).toHaveTextContent("パン");
      await u.click(screen.getByRole("button", { name: /登録する/ }));
      await flush();

      const [input] = saveFoodMaster.mock.calls[0] as [
        { values: Record<string, unknown> },
      ];
      expect(input.values).toMatchObject({
        name: "メロンパン",
        category: "bread",
      });
    });

    it("S-08a: 「栄養成分表示をカメラで読み取り」で、撮影の画面が開く", async () => {
      const u = user();
      render(<FoodMasterFormView prefill={{}} />);
      expect(
        screen.queryByRole("heading", { name: "栄養表を撮影" }),
      ).not.toBeInTheDocument();

      await u.click(
        screen.getByRole("button", { name: /栄養成分表示をカメラで読み取り/ }),
      );

      expect(
        screen.getByRole("heading", { name: "栄養表を撮影" }),
      ).toBeInTheDocument();
    });
  });

  describe("編集", () => {
    it("S-08a: 編集の画面は「食品を編集」で、サーバーで読んだ値が入っている", () => {
      render(<FoodMasterFormView existing={createFoodMaster()} prefill={{}} />);

      expect(
        screen.getByRole("heading", { name: "食品を編集" }),
      ).toBeInTheDocument();
      expect(nameField()).toHaveValue("サラダチキン");
      expect(brandField()).toHaveValue("セブンイレブン");
      expect(caloriesField()).toHaveValue(110);
      expect(proteinField()).toHaveValue(23.8);
      expect(screen.getByLabelText(/価格/)).toHaveValue(298);
    });

    it("AC-R-5: 変更を保存すると、そのマスタの id で保存し、成功を知らせて一覧に移る", async () => {
      saveFoodMaster.mockResolvedValue({ ok: true });
      const u = user();
      render(<FoodMasterFormView existing={createFoodMaster()} prefill={{}} />);

      await u.clear(caloriesField());
      await u.type(caloriesField(), "120");
      await u.click(screen.getByRole("button", { name: "変更を保存" }));
      await flush();

      const [input] = saveFoodMaster.mock.calls[0] as [
        { id: string; values: Record<string, unknown> },
      ];
      expect(input.id).toBe(MASTER_ID);
      expect(input.values).toMatchObject({
        name: "サラダチキン",
        calories: 120,
      });
      expect(toastSuccess).toHaveBeenCalledWith("変更を保存しました");
      expect(push).toHaveBeenCalledWith(LIST_PATH);
    });

    it("02 ローディング: 保存している間は保存ボタンを押せず、二重に送らない", async () => {
      const pending = deferred<{ ok: boolean }>();
      saveFoodMaster.mockReturnValue(pending.promise);
      const u = user();
      render(<FoodMasterFormView existing={createFoodMaster()} prefill={{}} />);

      await u.click(screen.getByRole("button", { name: "変更を保存" }));

      const saving = await screen.findByRole("button", { name: /保存中/ });
      expect(saving).toBeDisabled();
      await u.click(saving);
      expect(saveFoodMaster).toHaveBeenCalledTimes(1);

      await act(async () => {
        pending.resolve({ ok: true });
      });
      await flush();
    });

    it("AC-R-5: 保存に失敗すると、エラーを出して画面に残り、打った値も消さない", async () => {
      saveFoodMaster.mockResolvedValue({ ok: false });
      const u = user();
      render(<FoodMasterFormView existing={createFoodMaster()} prefill={{}} />);

      await u.clear(caloriesField());
      await u.type(caloriesField(), "120");
      await u.click(screen.getByRole("button", { name: "変更を保存" }));
      await flush();

      expect(toastError).toHaveBeenCalledWith("保存に失敗しました");
      expect(push).not.toHaveBeenCalled();
      expect(caloriesField()).toHaveValue(120);
    });

    it("AC-R-5: 呼び出しそのものが失敗しても(通信が切れた など)、画面を替えずにエラーを出す", async () => {
      saveFoodMaster.mockRejectedValue(new TypeError("Failed to fetch"));
      const u = user();
      render(<FoodMasterFormView existing={createFoodMaster()} prefill={{}} />);

      await u.click(screen.getByRole("button", { name: "変更を保存" }));
      await flush();

      expect(toastError).toHaveBeenCalledWith("保存に失敗しました");
      expect(push).not.toHaveBeenCalled();
    });

    it("AC-R-5: 削除すると、名前入りの確認の後にそのマスタの id で消し、知らせて一覧に移る", async () => {
      deleteFoodMaster.mockResolvedValue({ ok: true });
      const u = user();
      render(<FoodMasterFormView existing={createFoodMaster()} prefill={{}} />);

      await u.click(screen.getByRole("button", { name: /この食品を削除する/ }));
      expect(
        screen.getByText("「サラダチキン」を削除しますか？"),
      ).toBeInTheDocument();
      await u.click(screen.getByRole("button", { name: "削除する" }));
      await flush();

      expect(deleteFoodMaster).toHaveBeenCalledWith({ id: MASTER_ID });
      expect(toastSuccess).toHaveBeenCalledWith("食品を削除しました");
      expect(push).toHaveBeenCalledWith(LIST_PATH);
    });

    it("02 削除確認: キャンセルすると消さない", async () => {
      const u = user();
      render(<FoodMasterFormView existing={createFoodMaster()} prefill={{}} />);

      await u.click(screen.getByRole("button", { name: /この食品を削除する/ }));
      await u.click(screen.getByRole("button", { name: "キャンセル" }));

      expect(
        screen.queryByText("「サラダチキン」を削除しますか？"),
      ).not.toBeInTheDocument();
      expect(deleteFoodMaster).not.toHaveBeenCalled();
    });

    it("AC-R-5: 削除に失敗すると、エラーを出して画面に残る", async () => {
      deleteFoodMaster.mockResolvedValue({ ok: false });
      const u = user();
      render(<FoodMasterFormView existing={createFoodMaster()} prefill={{}} />);

      await u.click(screen.getByRole("button", { name: /この食品を削除する/ }));
      await u.click(screen.getByRole("button", { name: "削除する" }));
      await flush();

      expect(toastError).toHaveBeenCalledWith("削除に失敗しました");
      expect(push).not.toHaveBeenCalled();
    });
  });

  describe("戻るときの未保存の確認(G-8)", () => {
    it("G-8: 何も変えていなければ、確認を出さずに一覧に戻る", async () => {
      const u = user();
      render(<FoodMasterFormView existing={createFoodMaster()} prefill={{}} />);

      await u.click(backButton());

      expect(push).toHaveBeenCalledWith(LIST_PATH);
    });

    it("G-8: 入力を変えて戻ると確認が出て、「編集を続ける」なら残り、「破棄して戻る」なら一覧に戻る", async () => {
      const u = user();
      render(<FoodMasterFormView existing={createFoodMaster()} prefill={{}} />);

      await u.type(nameField(), "大");
      await u.click(backButton());
      let dialog = await screen.findByRole("alertdialog", {
        name: "変更を破棄しますか？",
      });
      await u.click(
        within(dialog).getByRole("button", { name: "編集を続ける" }),
      );
      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
      expect(push).not.toHaveBeenCalled();
      expect(nameField()).toHaveValue("サラダチキン大");

      await u.click(backButton());
      dialog = await screen.findByRole("alertdialog");
      await u.click(
        within(dialog).getByRole("button", { name: "破棄して戻る" }),
      );

      expect(push).toHaveBeenCalledWith(LIST_PATH);
    });
  });

  // With cacheComponents the detail screen stays mounted but hidden (<Activity mode="hidden">) after moving to another tab
  it("ui-tech §4: 入力の途中で別のタブに移って戻ると、打った値が続きから残っている", async () => {
    const foodMaster = createFoodMaster();
    const prefill = {};
    const onScreen = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <FoodMasterFormView existing={foodMaster} prefill={prefill} />
      </Activity>
    );
    const u = user();
    const { rerender } = render(onScreen("visible"));

    await u.clear(caloriesField());
    await u.type(caloriesField(), "130");

    await act(async () => {
      rerender(onScreen("hidden"));
    });
    await act(async () => {
      rerender(onScreen("visible"));
    });

    expect(caloriesField()).toHaveValue(130);
  });
});
