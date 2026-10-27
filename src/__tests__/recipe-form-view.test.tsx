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
import { RecipeFormView } from "@/components/features/recipes/components/recipe-form-view";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import { deferred } from "./helpers/daily-meals";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
}));

const saveRecipe = vi.fn();
const deleteRecipe = vi.fn();
vi.mock("@/components/features/recipes/api/actions", () => ({
  saveRecipe: (...args: unknown[]) => saveRecipe(...args),
  deleteRecipe: (...args: unknown[]) => deleteRecipe(...args),
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

const RECIPE_ID = "7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d";

const createRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: RECIPE_ID,
  userId: "user-1",
  name: "肉じゃが",
  servings: 2,
  calories: 800,
  protein: 30,
  fat: 20,
  carbs: 100,
  notes: "甘め",
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ingredients: [
    {
      id: "ing-1",
      recipeId: RECIPE_ID,
      ingredientName: "じゃがいも",
      quantity: 3,
      unit: "個",
      unitPrice: 40,
    },
  ],
  ...overrides,
});

const user = () => userEvent.setup();

const nameField = () => screen.getByLabelText(/レシピ名/);
const servingsField = () => screen.getByLabelText(/何人分/);
const caloriesField = () => screen.getByLabelText(/カロリー/);
/** The header's back arrow (the only button in the header) */
const backButton = () => within(screen.getByRole("banner")).getByRole("button");

/** Wait until the action's result has been handled (the transition ended) */
const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

describe("RecipeFormView (S-05 レシピ登録/編集)", () => {
  describe("新規", () => {
    it("S-05: 新規の画面は「レシピを登録」で、入力は空、削除の操作は無い", () => {
      render(<RecipeFormView />);

      expect(
        screen.getByRole("heading", { name: "レシピを登録" }),
      ).toBeInTheDocument();
      expect(nameField()).toHaveValue("");
      expect(
        screen.getByRole("button", { name: /登録する/ }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /削除する/ }),
      ).not.toBeInTheDocument();
    });

    it("AC-R-5: 登録に成功すると、成功を知らせてレシピの一覧に移る", async () => {
      saveRecipe.mockResolvedValue({ ok: true });
      const u = user();
      render(<RecipeFormView />);

      await u.type(nameField(), "カレー");
      await u.clear(caloriesField());
      await u.type(caloriesField(), "600");
      await u.click(screen.getByRole("button", { name: /登録する/ }));
      await flush();

      expect(saveRecipe).toHaveBeenCalledTimes(1);
      const [input] = saveRecipe.mock.calls[0] as [
        { id?: string; values: Record<string, unknown> },
      ];
      expect(input.id).toBeUndefined();
      expect(input.values).toMatchObject({ name: "カレー", calories: 600 });
      expect(toastSuccess).toHaveBeenCalledWith("レシピを登録しました");
      expect(push).toHaveBeenCalledWith("/recipes");
    });

    it("02 バリデーション: 名前が空のまま登録すると、欄の下にエラーが出て保存しない", async () => {
      const u = user();
      render(<RecipeFormView />);

      await u.click(screen.getByRole("button", { name: /登録する/ }));

      expect(
        await screen.findByText("レシピ名を入力してください"),
      ).toBeInTheDocument();
      expect(saveRecipe).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
    });

    it("02 バリデーション: 0人分では保存しない", async () => {
      const u = user();
      render(<RecipeFormView />);

      await u.type(nameField(), "カレー");
      await u.clear(servingsField());
      await u.type(servingsField(), "0");
      await u.click(screen.getByRole("button", { name: /登録する/ }));

      expect(
        await screen.findByText("1以上で入力してください"),
      ).toBeInTheDocument();
      expect(saveRecipe).not.toHaveBeenCalled();
    });

    it("S-05: 「追加」で材料の行が増え、単価×数量の食費合計がすぐ変わる", async () => {
      const u = user();
      render(<RecipeFormView />);
      expect(screen.getByText(/食費合計: ¥0/)).toBeInTheDocument();

      await u.click(screen.getByRole("button", { name: "追加" }));
      await u.type(screen.getByRole("textbox", { name: "材料名" }), "玉ねぎ");
      const [quantity] = screen.getAllByLabelText(/数量/);
      await u.clear(quantity);
      await u.type(quantity, "2");
      const [unitPrice] = screen.getAllByLabelText(/単価/);
      await u.clear(unitPrice);
      await u.type(unitPrice, "50");

      expect(screen.getByText(/食費合計: ¥100/)).toBeInTheDocument();
    });

    it("S-05: 材料名が空の行は材料として保存しない", async () => {
      saveRecipe.mockResolvedValue({ ok: true });
      const u = user();
      render(<RecipeFormView />);

      await u.type(nameField(), "カレー");
      await u.click(screen.getByRole("button", { name: "追加" }));
      await u.click(screen.getByRole("button", { name: /登録する/ }));
      await flush();

      const [input] = saveRecipe.mock.calls[0] as [{ ingredients: unknown[] }];
      expect(input.ingredients).toEqual([]);
    });
  });

  describe("編集", () => {
    it("N-2: 編集の画面は「レシピを編集」で、サーバーで読んだ値と材料が入っている", () => {
      render(<RecipeFormView existing={createRecipe()} />);

      expect(
        screen.getByRole("heading", { name: "レシピを編集" }),
      ).toBeInTheDocument();
      expect(nameField()).toHaveValue("肉じゃが");
      expect(servingsField()).toHaveValue(2);
      expect(caloriesField()).toHaveValue(800);
      expect(screen.getByRole("textbox", { name: "材料名" })).toHaveValue(
        "じゃがいも",
      );
      // 3 個 × ¥40
      expect(screen.getByText(/食費合計: ¥120/)).toBeInTheDocument();
    });

    it("AC-R-5: 変更を保存すると、そのレシピの id で保存し、成功を知らせて一覧に移る", async () => {
      saveRecipe.mockResolvedValue({ ok: true });
      const u = user();
      render(<RecipeFormView existing={createRecipe()} />);

      await u.clear(nameField());
      await u.type(nameField(), "豚じゃが");
      await u.click(screen.getByRole("button", { name: "変更を保存" }));
      await flush();

      const [input] = saveRecipe.mock.calls[0] as [
        {
          id: string;
          values: Record<string, unknown>;
          ingredients: Record<string, unknown>[];
        },
      ];
      expect(input.id).toBe(RECIPE_ID);
      expect(input.values).toMatchObject({ name: "豚じゃが", servings: 2 });
      expect(input.ingredients).toEqual([
        expect.objectContaining({
          ingredientName: "じゃがいも",
          quantity: 3,
          unit: "個",
          unitPrice: 40,
        }),
      ]);
      expect(toastSuccess).toHaveBeenCalledWith("変更を保存しました");
      expect(push).toHaveBeenCalledWith("/recipes");
    });

    it("02 ローディング: 保存している間は保存ボタンを押せず、二重に送らない", async () => {
      const pending = deferred<{ ok: boolean }>();
      saveRecipe.mockReturnValue(pending.promise);
      const u = user();
      render(<RecipeFormView existing={createRecipe()} />);

      await u.click(screen.getByRole("button", { name: "変更を保存" }));

      const saving = await screen.findByRole("button", { name: /保存中/ });
      expect(saving).toBeDisabled();
      await u.click(saving);
      expect(saveRecipe).toHaveBeenCalledTimes(1);

      await act(async () => {
        pending.resolve({ ok: true });
      });
      await flush();
    });

    it("AC-R-5: 保存に失敗すると、エラーを出して画面に残り、打った値も消さない", async () => {
      saveRecipe.mockResolvedValue({ ok: false });
      const u = user();
      render(<RecipeFormView existing={createRecipe()} />);

      await u.clear(nameField());
      await u.type(nameField(), "豚じゃが");
      await u.click(screen.getByRole("button", { name: "変更を保存" }));
      await flush();

      expect(toastError).toHaveBeenCalledWith("保存に失敗しました");
      expect(toastSuccess).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
      expect(nameField()).toHaveValue("豚じゃが");
      expect(screen.getByRole("button", { name: "変更を保存" })).toBeEnabled();
    });

    it("AC-R-5: 呼び出しそのものが失敗しても(通信が切れた など)、画面を替えずにエラーを出す", async () => {
      saveRecipe.mockRejectedValue(new TypeError("Failed to fetch"));
      const u = user();
      render(<RecipeFormView existing={createRecipe()} />);

      await u.click(screen.getByRole("button", { name: "変更を保存" }));
      await flush();

      expect(toastError).toHaveBeenCalledWith("保存に失敗しました");
      expect(push).not.toHaveBeenCalled();
      expect(nameField()).toHaveValue("肉じゃが");
    });

    it("02 削除確認: 「このレシピを削除する」で、名前入りの確認が出て、キャンセルすると消さない", async () => {
      const u = user();
      render(<RecipeFormView existing={createRecipe()} />);

      await u.click(
        screen.getByRole("button", { name: /このレシピを削除する/ }),
      );
      expect(
        screen.getByText("「肉じゃが」を削除しますか？"),
      ).toBeInTheDocument();

      await u.click(screen.getByRole("button", { name: "キャンセル" }));

      expect(
        screen.queryByText("「肉じゃが」を削除しますか？"),
      ).not.toBeInTheDocument();
      expect(deleteRecipe).not.toHaveBeenCalled();
    });

    it("AC-R-5: 削除すると、そのレシピの id で消し、知らせて一覧に移る", async () => {
      deleteRecipe.mockResolvedValue({ ok: true });
      const u = user();
      render(<RecipeFormView existing={createRecipe()} />);

      await u.click(
        screen.getByRole("button", { name: /このレシピを削除する/ }),
      );
      await u.click(screen.getByRole("button", { name: "削除する" }));
      await flush();

      expect(deleteRecipe).toHaveBeenCalledWith({ id: RECIPE_ID });
      expect(toastSuccess).toHaveBeenCalledWith("レシピを削除しました");
      expect(push).toHaveBeenCalledWith("/recipes");
    });

    it("02 ローディング: 削除している間は削除ボタンを押せない", async () => {
      const pending = deferred<{ ok: boolean }>();
      deleteRecipe.mockReturnValue(pending.promise);
      const u = user();
      render(<RecipeFormView existing={createRecipe()} />);

      await u.click(
        screen.getByRole("button", { name: /このレシピを削除する/ }),
      );
      await u.click(screen.getByRole("button", { name: "削除する" }));

      expect(
        await screen.findByRole("button", { name: "削除中..." }),
      ).toBeDisabled();

      await act(async () => {
        pending.resolve({ ok: true });
      });
      await flush();
    });

    it("AC-R-5: 削除に失敗すると、エラーを出して画面に残る", async () => {
      deleteRecipe.mockResolvedValue({ ok: false });
      const u = user();
      render(<RecipeFormView existing={createRecipe()} />);

      await u.click(
        screen.getByRole("button", { name: /このレシピを削除する/ }),
      );
      await u.click(screen.getByRole("button", { name: "削除する" }));
      await flush();

      expect(toastError).toHaveBeenCalledWith("削除に失敗しました");
      expect(push).not.toHaveBeenCalled();
      expect(nameField()).toHaveValue("肉じゃが");
    });
  });

  describe("戻るときの未保存の確認(G-8)", () => {
    it("G-8: 何も変えていなければ、確認を出さずに一覧に戻る", async () => {
      const u = user();
      render(<RecipeFormView existing={createRecipe()} />);

      await u.click(backButton());

      expect(push).toHaveBeenCalledWith("/recipes");
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("G-8: 入力を変えて戻ると「変更を破棄しますか？」が出て、「編集を続ける」なら入力が残る", async () => {
      const u = user();
      render(<RecipeFormView existing={createRecipe()} />);

      await u.type(nameField(), "改");
      await u.click(backButton());

      const dialog = await screen.findByRole("alertdialog", {
        name: "変更を破棄しますか？",
      });
      await u.click(
        within(dialog).getByRole("button", { name: "編集を続ける" }),
      );

      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );
      expect(push).not.toHaveBeenCalled();
      expect(nameField()).toHaveValue("肉じゃが改");
    });

    it("G-8: 確認で「破棄して戻る」を選ぶと一覧に戻る", async () => {
      const u = user();
      render(<RecipeFormView existing={createRecipe()} />);

      await u.type(nameField(), "改");
      await u.click(backButton());
      const dialog = await screen.findByRole("alertdialog");
      await u.click(
        within(dialog).getByRole("button", { name: "破棄して戻る" }),
      );

      expect(push).toHaveBeenCalledWith("/recipes");
    });

    it("G-8: 材料を足しただけでも、戻るときに確認が出る", async () => {
      const u = user();
      render(<RecipeFormView existing={createRecipe()} />);

      await u.click(screen.getByRole("button", { name: "追加" }));
      await u.click(backButton());

      expect(
        await screen.findByRole("alertdialog", {
          name: "変更を破棄しますか？",
        }),
      ).toBeInTheDocument();
      expect(push).not.toHaveBeenCalled();
    });
  });

  // With cacheComponents the detail screen stays mounted but hidden (<Activity mode="hidden">) after moving to another tab
  it("ui-tech §4: 入力の途中で別のタブに移って戻ると、打った値が続きから残っている", async () => {
    const recipe = createRecipe();
    const onScreen = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <RecipeFormView existing={recipe} />
      </Activity>
    );
    const u = user();
    const { rerender } = render(onScreen("visible"));

    await u.clear(nameField());
    await u.type(nameField(), "豚じゃが");
    await u.click(screen.getByRole("button", { name: "追加" }));

    await act(async () => {
      rerender(onScreen("hidden"));
    });
    await act(async () => {
      rerender(onScreen("visible"));
    });

    expect(nameField()).toHaveValue("豚じゃが");
    expect(screen.getAllByRole("textbox", { name: "材料名" })).toHaveLength(2);
  });
});
