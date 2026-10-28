import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Activity } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import { SetMenuFormView } from "@/components/features/set-menus/components/set-menu-form-view";
import type { SetMenu } from "@/components/features/set-menus/types/set-menu";
import { deferred } from "./helpers/daily-meals";
import { renderWithQueryClient } from "./helpers/query-client";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
}));

const saveSetMenu = vi.fn();
const deleteSetMenu = vi.fn();
vi.mock("@/components/features/set-menus/api/actions", () => ({
  saveSetMenu: (...args: unknown[]) => saveSetMenu(...args),
  deleteSetMenu: (...args: unknown[]) => deleteSetMenu(...args),
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

const SET_MENU_ID = "5c6d7e8f-9a0b-4c1d-8e2f-3a4b5c6d7e8f";
const RECIPE_ID = "7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d";
const MASTER_ID = "3f1c2b4a-5d6e-4f70-8a9b-0c1d2e3f4a5b";

// 2 servings: one person's share is 400 kcal, P15 F10 C50, and ¥150 of ingredients (3 × ¥100 / 2)
const recipe: Recipe = {
  id: RECIPE_ID,
  userId: "user-1",
  name: "肉じゃが",
  servings: 2,
  calories: 800,
  protein: 30,
  fat: 20,
  carbs: 100,
  notes: null,
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
      unitPrice: 100,
    },
  ],
};

const foodMaster: FoodMaster = {
  id: MASTER_ID,
  userId: "user-1",
  name: "納豆",
  brand: "おかめ",
  category: null,
  calories: 90,
  protein: 8,
  fat: 5,
  carbs: 6,
  defaultPrice: 60,
  notes: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const otherMaster: FoodMaster = {
  ...foodMaster,
  id: "8a7b6c5d-4e3f-4a2b-9c1d-0e9f8a7b6c5d",
  name: "サラダチキン",
  brand: "セブン",
  calories: 110,
  defaultPrice: null,
};

const createSetMenu = (overrides: Partial<SetMenu> = {}): SetMenu => ({
  id: SET_MENU_ID,
  userId: "user-1",
  name: "朝定食セット",
  totalCalories: 340,
  totalProtein: 12,
  totalFat: 5.5,
  totalCarbs: 61,
  totalCost: 110,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  items: [
    {
      id: "item-1",
      setMenuId: SET_MENU_ID,
      name: "ご飯",
      recipeId: null,
      foodMasterId: "fm-rice",
      calories: 250,
      protein: 4,
      fat: 0.5,
      carbs: 55,
      cost: 50,
      servingQuantity: 1,
      sortOrder: 0,
    },
  ],
  ...overrides,
});

const renderForm = (existing?: SetMenu) =>
  renderWithQueryClient(
    <SetMenuFormView
      existing={existing}
      recipes={[recipe]}
      foodMasters={[foodMaster, otherMaster]}
    />,
  );

const user = () => userEvent.setup();
const nameField = () => screen.getByLabelText(/セットメニュー名/);
const backButton = () =>
  within(screen.getByRole("banner")).getByRole("button", {
    name: "セットメニューの一覧に戻る",
  });
const totals = () => screen.getByText(/^合計:/);
const addRecipe = async (u: ReturnType<typeof user>) =>
  u.click(screen.getByRole("button", { name: /肉じゃが/ }));
const addMaster = async (u: ReturnType<typeof user>, name = /納豆/) => {
  await u.click(screen.getByRole("tab", { name: "マスタから" }));
  await u.click(screen.getByRole("button", { name }));
};

/** Wait until the action's result has been handled (the transition ended) */
const flush = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

describe("SetMenuFormView (S-06a セットメニュー登録/編集)", () => {
  describe("新規", () => {
    it("S-06a: 新規の画面は「セットメニューを登録」で、名前は空、アイテムは無く、削除の操作は無い", () => {
      renderForm();

      expect(
        screen.getByRole("heading", { name: "セットメニューを登録" }),
      ).toBeInTheDocument();
      expect(nameField()).toHaveValue("");
      expect(
        screen.getByText(
          "下の「アイテムを追加」からメニューを構成してください",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /登録する/ }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /このセットメニューを削除する/ }),
      ).not.toBeInTheDocument();
    });

    it("S-06a: 「レシピから追加」は1人分の値で、レシピのバッジ付きで加わり、合計に出る", async () => {
      const u = user();
      renderForm();

      await addRecipe(u);

      expect(
        screen.getByRole("button", { name: "「肉じゃが」を外す" }),
      ).toBeInTheDocument();
      expect(screen.getByText("レシピ")).toBeInTheDocument();
      expect(totals()).toHaveTextContent("合計: 400 kcal · ¥150");
    });

    it("S-06a: 「食品マスタから追加」はマスタの値と既定の価格で、マスタのバッジ付きで加わる", async () => {
      const u = user();
      renderForm();

      await addMaster(u);

      expect(
        screen.getByRole("button", { name: "「納豆」を外す" }),
      ).toBeInTheDocument();
      expect(screen.getByText("マスタ")).toBeInTheDocument();
      expect(totals()).toHaveTextContent("合計: 90 kcal · ¥60");
    });

    it("S-06a: 価格の無いマスタは食費 0 で加わる", async () => {
      const u = user();
      renderForm();

      await addMaster(u, /サラダチキン/);

      expect(totals()).toHaveTextContent("合計: 110 kcal · ¥0");
    });

    it("S-06a: 合計は全アイテムの値から計算し、PFC も出す", async () => {
      const u = user();
      renderForm();

      await addRecipe(u);
      await addMaster(u);

      expect(totals()).toHaveTextContent("合計: 490 kcal · ¥210");
      expect(screen.getByText(/P:\s*23\.0/)).toBeInTheDocument();
      expect(screen.getByText(/F:\s*15\.0/)).toBeInTheDocument();
      expect(screen.getByText(/C:\s*56\.0/)).toBeInTheDocument();
    });

    it("S-06a: 分量の±は 0.5 刻みで、変えるとカロリー・食費の合計がすぐ変わる", async () => {
      const u = user();
      renderForm();
      await addMaster(u);

      await u.click(screen.getByRole("button", { name: "「納豆」を増やす" }));
      expect(totals()).toHaveTextContent("合計: 135 kcal · ¥90");

      await u.click(screen.getByRole("button", { name: "「納豆」を増やす" }));
      expect(totals()).toHaveTextContent("合計: 180 kcal · ¥120");

      await u.click(screen.getByRole("button", { name: "「納豆」を減らす" }));
      expect(totals()).toHaveTextContent("合計: 135 kcal · ¥90");
    });

    it("S-06a: 分量は 0.5 より減らせない(0.5 で「減らす」を押せない)", async () => {
      const u = user();
      renderForm();
      await addMaster(u);

      await u.click(screen.getByRole("button", { name: "「納豆」を減らす" }));

      expect(totals()).toHaveTextContent("合計: 45 kcal · ¥30");
      expect(
        screen.getByRole("button", { name: "「納豆」を減らす" }),
      ).toBeDisabled();
    });

    it("S-06a: アイテムの「×」で外すと、合計からも消える", async () => {
      const u = user();
      renderForm();
      await addRecipe(u);
      await addMaster(u);

      await u.click(screen.getByRole("button", { name: "「肉じゃが」を外す" }));

      expect(
        screen.queryByRole("button", { name: "「肉じゃが」を外す" }),
      ).not.toBeInTheDocument();
      expect(totals()).toHaveTextContent("合計: 90 kcal · ¥60");
    });

    it("S-06a: 最低1アイテム必要。アイテムが無いまま登録すると、エラーを出して保存しない", async () => {
      const u = user();
      renderForm();

      await u.type(nameField(), "空のセット");
      await u.click(screen.getByRole("button", { name: /登録する/ }));
      await flush();

      expect(toastError).toHaveBeenCalledWith(
        "アイテムを1つ以上追加してください",
      );
      expect(saveSetMenu).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
    });

    it("ui.md 入力: 名前の欄は、キーボードの決定が「完了」で、ブラウザの入力候補を出さない", () => {
      renderForm();

      expect(nameField()).toHaveAttribute("enterkeyhint", "done");
      expect(nameField()).toHaveAttribute("autocomplete", "off");
    });

    it("02 バリデーション: 名前が空のまま登録すると、欄の下にエラーが出て(aria-describedby)保存しない", async () => {
      const u = user();
      renderForm();
      await addRecipe(u);

      await u.click(screen.getByRole("button", { name: /登録する/ }));

      await waitFor(() =>
        expect(nameField()).toHaveAccessibleDescription(
          "セットメニュー名を入力してください",
        ),
      );
      expect(nameField()).toHaveAttribute("aria-invalid", "true");
      expect(saveSetMenu).not.toHaveBeenCalled();
    });

    it("AC-R-5: 登録に成功すると、名前とアイテム(分量込み)を送り、成功を知らせて一覧に移る", async () => {
      saveSetMenu.mockResolvedValue({ ok: true });
      const u = user();
      renderForm();

      await u.type(nameField(), "和定食");
      await addRecipe(u);
      await addMaster(u);
      await u.click(screen.getByRole("button", { name: "「納豆」を増やす" }));
      await u.click(screen.getByRole("button", { name: /登録する/ }));
      await flush();

      expect(saveSetMenu).toHaveBeenCalledTimes(1);
      const [input] = saveSetMenu.mock.calls[0] as [
        {
          id?: string;
          values: { name: string };
          items: Record<string, unknown>[];
        },
      ];
      expect(input.id).toBeUndefined();
      expect(input.values).toEqual({ name: "和定食" });
      expect(input.items).toEqual([
        expect.objectContaining({
          name: "肉じゃが",
          recipeId: RECIPE_ID,
          foodMasterId: null,
          calories: 400,
          cost: 150,
          servingQuantity: 1,
        }),
        expect.objectContaining({
          name: "納豆",
          recipeId: null,
          foodMasterId: MASTER_ID,
          calories: 90,
          cost: 60,
          servingQuantity: 1.5,
        }),
      ]);
      expect(toastSuccess).toHaveBeenCalledWith("セットメニューを登録しました");
      expect(push).toHaveBeenCalledWith("/other/set-menus");
    });

    // The screen stays mounted (hidden) after leaving, so the next "new" must not show the last one's input
    it("ui-tech §4: 登録した後は、隠れて残る新規の画面が空に戻っている", async () => {
      saveSetMenu.mockResolvedValue({ ok: true });
      const u = user();
      renderForm();

      await u.type(nameField(), "和定食");
      await addRecipe(u);
      await u.click(screen.getByRole("button", { name: /登録する/ }));
      await flush();

      expect(nameField()).toHaveValue("");
      expect(
        screen.queryByRole("button", { name: "「肉じゃが」を外す" }),
      ).not.toBeInTheDocument();
    });

    it("S-06a: レシピの候補を名前で絞り、合わなければ「該当するレシピがありません」", async () => {
      const u = user();
      renderForm();

      await u.type(
        screen.getByRole("textbox", { name: "レシピ名で検索..." }),
        "カレー",
      );

      expect(
        screen.queryByRole("button", { name: /肉じゃが/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("該当するレシピがありません"),
      ).toBeInTheDocument();
    });

    it("S-06a: 食品マスタの候補は食品名・ブランドで絞れる", async () => {
      const u = user();
      renderForm();
      await u.click(screen.getByRole("tab", { name: "マスタから" }));

      await u.type(
        screen.getByRole("textbox", { name: "食品名・ブランドで検索..." }),
        "セブン",
      );

      expect(
        screen.getByRole("button", { name: /サラダチキン/ }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /納豆/ }),
      ).not.toBeInTheDocument();
    });
  });

  describe("編集", () => {
    it("S-06a: 編集の画面は「セットメニューを編集」で、サーバーで読んだ名前・アイテム・合計が入っている", () => {
      renderForm(createSetMenu());

      expect(
        screen.getByRole("heading", { name: "セットメニューを編集" }),
      ).toBeInTheDocument();
      expect(nameField()).toHaveValue("朝定食セット");
      expect(
        screen.getByRole("button", { name: "「ご飯」を外す" }),
      ).toBeInTheDocument();
      expect(totals()).toHaveTextContent("合計: 250 kcal · ¥50");
    });

    it("AC-R-5: 変更を保存すると、そのセットメニューの id で保存し、成功を知らせて一覧に移る", async () => {
      saveSetMenu.mockResolvedValue({ ok: true });
      const u = user();
      renderForm(createSetMenu());

      await u.clear(nameField());
      await u.type(nameField(), "和朝食");
      await u.click(screen.getByRole("button", { name: "変更を保存" }));
      await flush();

      const [input] = saveSetMenu.mock.calls[0] as [
        { id: string; values: { name: string }; items: unknown[] },
      ];
      expect(input.id).toBe(SET_MENU_ID);
      expect(input.values).toEqual({ name: "和朝食" });
      expect(input.items).toEqual([
        expect.objectContaining({ name: "ご飯", servingQuantity: 1 }),
      ]);
      expect(toastSuccess).toHaveBeenCalledWith("変更を保存しました");
      expect(push).toHaveBeenCalledWith("/other/set-menus");
    });

    it("02 ローディング: 保存している間は保存ボタンを押せず、二重に送らない", async () => {
      const pending = deferred<{ ok: boolean }>();
      saveSetMenu.mockReturnValue(pending.promise);
      const u = user();
      renderForm(createSetMenu());

      await u.click(screen.getByRole("button", { name: "変更を保存" }));

      const saving = await screen.findByRole("button", { name: /保存中/ });
      expect(saving).toBeDisabled();
      await u.click(saving);
      expect(saveSetMenu).toHaveBeenCalledTimes(1);

      await act(async () => {
        pending.resolve({ ok: true });
      });
      await flush();
    });

    it("AC-R-5: 保存に失敗すると(編集中に別の所で消された など)、エラーを出して画面に残り、打った値も消さない", async () => {
      saveSetMenu.mockResolvedValue({ ok: false });
      const u = user();
      renderForm(createSetMenu());

      await u.clear(nameField());
      await u.type(nameField(), "和朝食");
      await u.click(screen.getByRole("button", { name: "「ご飯」を増やす" }));
      await u.click(screen.getByRole("button", { name: "変更を保存" }));
      await flush();

      expect(toastError).toHaveBeenCalledWith("保存に失敗しました");
      expect(toastSuccess).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
      expect(nameField()).toHaveValue("和朝食");
      expect(totals()).toHaveTextContent("合計: 375 kcal · ¥75");
    });

    it("AC-R-5: 呼び出しそのものが失敗しても(通信が切れた など)、画面を替えずにエラーを出す", async () => {
      saveSetMenu.mockRejectedValue(new TypeError("Failed to fetch"));
      const u = user();
      renderForm(createSetMenu());

      await u.click(screen.getByRole("button", { name: "変更を保存" }));
      await flush();

      expect(toastError).toHaveBeenCalledWith("保存に失敗しました");
      expect(push).not.toHaveBeenCalled();
    });

    it("02 削除確認: 「このセットメニューを削除する」で、名前と過去の記録への影響の説明が出て、キャンセルすると消さない", async () => {
      const u = user();
      renderForm(createSetMenu());

      await u.click(
        screen.getByRole("button", { name: /このセットメニューを削除する/ }),
      );
      expect(
        screen.getByText("「朝定食セット」を削除しますか？"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/過去の食事記録は影響を受けません。/),
      ).toBeInTheDocument();

      await u.click(screen.getByRole("button", { name: "キャンセル" }));

      expect(
        screen.queryByText("「朝定食セット」を削除しますか？"),
      ).not.toBeInTheDocument();
      expect(deleteSetMenu).not.toHaveBeenCalled();
    });

    it("S-06a: 削除すると、そのセットメニューの id で消し、知らせて一覧に移る", async () => {
      deleteSetMenu.mockResolvedValue({ ok: true });
      const u = user();
      renderForm(createSetMenu());

      await u.click(
        screen.getByRole("button", { name: /このセットメニューを削除する/ }),
      );
      await u.click(screen.getByRole("button", { name: "削除する" }));
      await flush();

      expect(deleteSetMenu).toHaveBeenCalledWith({ id: SET_MENU_ID });
      expect(toastSuccess).toHaveBeenCalledWith("セットメニューを削除しました");
      expect(push).toHaveBeenCalledWith("/other/set-menus");
    });

    it("AC-R-5: 削除に失敗すると、エラーを出して画面に残る", async () => {
      deleteSetMenu.mockResolvedValue({ ok: false });
      const u = user();
      renderForm(createSetMenu());

      await u.click(
        screen.getByRole("button", { name: /このセットメニューを削除する/ }),
      );
      await u.click(screen.getByRole("button", { name: "削除する" }));
      await flush();

      expect(toastError).toHaveBeenCalledWith("削除に失敗しました");
      expect(push).not.toHaveBeenCalled();
      expect(nameField()).toHaveValue("朝定食セット");
    });
  });

  describe("戻るときの未保存の確認(G-8)", () => {
    it("G-8: 何も変えていなければ、確認を出さずに一覧に戻る", async () => {
      const u = user();
      renderForm(createSetMenu());

      await u.click(backButton());

      expect(push).toHaveBeenCalledWith("/other/set-menus");
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("G-8: 分量を変えただけでも、戻るときに確認が出て、「編集を続ける」なら変えた分量が残る", async () => {
      const u = user();
      renderForm(createSetMenu());

      await u.click(screen.getByRole("button", { name: "「ご飯」を増やす" }));
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
      expect(totals()).toHaveTextContent("合計: 375 kcal · ¥75");
    });

    it("ui-tech §4: 「破棄して戻る」を選ぶと一覧に戻り、隠れて残る画面は最初の値に戻っている", async () => {
      const u = user();
      renderForm(createSetMenu());

      await u.type(nameField(), "改");
      await u.click(screen.getByRole("button", { name: "「ご飯」を外す" }));
      await u.click(backButton());
      const dialog = await screen.findByRole("alertdialog");
      await u.click(
        within(dialog).getByRole("button", { name: "破棄して戻る" }),
      );

      expect(push).toHaveBeenCalledWith("/other/set-menus");
      expect(nameField()).toHaveValue("朝定食セット");
      expect(
        screen.getByRole("button", { name: "「ご飯」を外す" }),
      ).toBeInTheDocument();
    });
  });

  // With cacheComponents the detail screen stays mounted but hidden (<Activity mode="hidden">) after moving to another tab
  it("ui-tech §4: 入力の途中で別のタブに移って戻ると、打った名前と変えたアイテムが続きから残っている", async () => {
    const setMenu = createSetMenu();
    const onScreen = (mode: "visible" | "hidden", existing: SetMenu) => (
      <Activity mode={mode}>
        <SetMenuFormView
          existing={existing}
          recipes={[recipe]}
          foodMasters={[foodMaster]}
        />
      </Activity>
    );
    const u = user();
    const { rerender } = renderWithQueryClient(onScreen("visible", setMenu));

    await u.clear(nameField());
    await u.type(nameField(), "和朝食");
    await addRecipe(u);

    await act(async () => {
      rerender(onScreen("hidden", setMenu));
    });
    // The server sends the same set menu again (a new object) when the screens are re-read
    await act(async () => {
      rerender(onScreen("visible", createSetMenu()));
    });

    expect(nameField()).toHaveValue("和朝食");
    expect(
      screen.getByRole("button", { name: "「肉じゃが」を外す" }),
    ).toBeInTheDocument();
  });
});
