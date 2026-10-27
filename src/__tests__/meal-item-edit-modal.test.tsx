import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MealItemEditModal } from "@/components/features/meals/components/meal-item-edit-modal";
import { createMealItem, renderWithDailyMeals } from "./helpers/daily-meals";

/** vaul reads CSS transforms on pointer release, which jsdom does not have; render the drawer as plain markup */
vi.mock("vaul", () => {
  const Passthrough = ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  );
  const Drawer = ({
    children,
    open,
  }: {
    children: ReactNode;
    open?: boolean;
  }) => (open ? <div>{children}</div> : null);
  Drawer.Root = Drawer;
  Drawer.Portal = Passthrough;
  Drawer.Overlay = () => <div />;
  Drawer.Content = Passthrough;
  Drawer.Title = Passthrough;
  Drawer.Description = Passthrough;
  Drawer.Close = Passthrough;
  Drawer.Handle = () => <div />;
  return { Drawer };
});

const updateMealItem = vi.fn();
const deleteMealItem = vi.fn();
vi.mock("@/components/features/meals/api/actions", () => ({
  updateMealItem: (...args: unknown[]) => updateMealItem(...args),
  deleteMealItem: (...args: unknown[]) => deleteMealItem(...args),
  registerMealItems: vi.fn(),
  copyPreviousDayMeal: vi.fn(),
  transferMealToPlan: vi.fn(),
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

const ITEM = createMealItem({
  id: "item-1",
  name: "サラダチキン",
  calories: 120,
  protein: 25,
  fat: 2,
  carbs: 1,
  cost: 250,
  sourceType: "manual",
});

const renderModal = (
  item = ITEM,
  { isOpen = true, onClose = vi.fn(), onSaveFailed = vi.fn() } = {},
) => {
  const view = renderWithDailyMeals(
    <MealItemEditModal
      item={item}
      isOpen={isOpen}
      onClose={onClose}
      onSaveFailed={onSaveFailed}
    />,
  );
  return { ...view, onClose, onSaveFailed };
};

/** Type new values into the name and calorie fields, then press 変更を保存 */
const editAndSave = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.clear(screen.getByLabelText("メニュー名"));
  await user.type(screen.getByLabelText("メニュー名"), "サラダチキン大盛り");
  await user.clear(screen.getByLabelText("カロリー (kcal)"));
  await user.type(screen.getByLabelText("カロリー (kcal)"), "250");
  await user.click(screen.getByRole("button", { name: "変更を保存" }));
};

/** The item as it was, with what was typed in editAndSave */
const ITEM_WITH_TYPED_VALUES = {
  ...ITEM,
  name: "サラダチキン大盛り",
  calories: 250,
};

describe("MealItemEditModal", () => {
  it("S-02a: with no item it renders nothing", () => {
    const { container } = renderWithDailyMeals(
      <MealItemEditModal
        item={null}
        isOpen={false}
        onClose={vi.fn()}
        onSaveFailed={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("S-02a: shows the title アイテム編集 and where the item came from as a badge", () => {
    renderModal();
    expect(screen.getByText("アイテム編集")).toBeInTheDocument();
    expect(screen.getByText("手動")).toBeInTheDocument();
  });

  it("S-02a: an item read by OCR shows the OCR badge", () => {
    renderModal(createMealItem({ sourceType: "ocr" }));
    expect(screen.getByText("OCR")).toBeInTheDocument();
  });

  it("S-02a: every field starts with the item's values", () => {
    renderModal();
    expect(screen.getByLabelText("メニュー名")).toHaveValue("サラダチキン");
    expect(screen.getByLabelText("カロリー (kcal)")).toHaveValue(120);
    expect(screen.getByLabelText("食費 (円)")).toHaveValue(250);
    expect(screen.getByLabelText("P (g)")).toHaveValue(25);
    expect(screen.getByLabelText("F (g)")).toHaveValue(2);
    expect(screen.getByLabelText("C (g)")).toHaveValue(1);
  });

  it("S-02a: 変更を保存 closes the drawer and saves the new values for this item (no date needed)", async () => {
    const user = userEvent.setup();
    updateMealItem.mockResolvedValue({ ok: true });
    const { onClose } = renderModal();

    await user.clear(screen.getByLabelText("カロリー (kcal)"));
    await user.type(screen.getByLabelText("カロリー (kcal)"), "250");
    await user.click(screen.getByRole("button", { name: "変更を保存" }));

    await waitFor(() =>
      expect(updateMealItem).toHaveBeenCalledWith({
        itemId: "item-1",
        values: {
          name: "サラダチキン",
          calories: 250,
          protein: 25,
          fat: 2,
          carbs: 1,
          cost: 250,
        },
      }),
    );
    expect(onClose).toHaveBeenCalled();
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("変更を保存しました"),
    );
  });

  it("S-02a: an empty name is not saved and the error is shown under the field", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.clear(screen.getByLabelText("メニュー名"));
    await user.click(screen.getByRole("button", { name: "変更を保存" }));

    expect(
      await screen.findByText("メニュー名を入力してください"),
    ).toBeInTheDocument();
    expect(updateMealItem).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("AC-R-5: when saving fails an error naming the item is shown", async () => {
    const user = userEvent.setup();
    updateMealItem.mockResolvedValue({ ok: false });
    renderModal();

    await user.click(screen.getByRole("button", { name: "変更を保存" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "「サラダチキン」の更新に失敗しました",
      ),
    );
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("AC-R-5: when saving fails it hands back the item with the typed values, so the edit drawer can reopen with them", async () => {
    const user = userEvent.setup();
    updateMealItem.mockResolvedValue({ ok: false });
    const { onSaveFailed } = renderModal();

    await editAndSave(user);

    await waitFor(() =>
      expect(onSaveFailed).toHaveBeenCalledWith(ITEM_WITH_TYPED_VALUES),
    );
    expect(onSaveFailed).toHaveBeenCalledTimes(1);
  });

  it("AC-R-5: when the save request itself fails (no connection) it also hands back the typed values", async () => {
    const user = userEvent.setup();
    updateMealItem.mockRejectedValue(new TypeError("Failed to fetch"));
    const { onSaveFailed } = renderModal();

    await editAndSave(user);

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "「サラダチキン」の更新に失敗しました",
      ),
    );
    expect(onSaveFailed).toHaveBeenCalledWith(ITEM_WITH_TYPED_VALUES);
    expect(onSaveFailed).toHaveBeenCalledTimes(1);
  });

  it("AC-R-5: when saving succeeds the edit drawer is not reopened", async () => {
    const user = userEvent.setup();
    updateMealItem.mockResolvedValue({ ok: true });
    const { onSaveFailed } = renderModal();

    await editAndSave(user);

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("変更を保存しました"),
    );
    expect(onSaveFailed).not.toHaveBeenCalled();
  });

  it("S-02a: このアイテムを削除する asks to confirm with the item's name", async () => {
    const user = userEvent.setup();
    renderModal(createMealItem({ name: "テストアイテム" }));

    await user.click(
      screen.getByRole("button", { name: "このアイテムを削除する" }),
    );

    expect(
      screen.getByText("「テストアイテム」を削除しますか？"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "キャンセル" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "削除する" }),
    ).toBeInTheDocument();
    expect(deleteMealItem).not.toHaveBeenCalled();
  });

  it("S-02a: キャンセル hides the confirmation and deletes nothing", async () => {
    const user = userEvent.setup();
    renderModal(createMealItem({ name: "テストアイテム" }));

    await user.click(
      screen.getByRole("button", { name: "このアイテムを削除する" }),
    );
    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(
      screen.queryByText("「テストアイテム」を削除しますか？"),
    ).not.toBeInTheDocument();
    expect(deleteMealItem).not.toHaveBeenCalled();
  });

  it("S-02a: 削除する closes the drawer and deletes this item (no date needed)", async () => {
    const user = userEvent.setup();
    deleteMealItem.mockResolvedValue({ ok: true });
    const { onClose } = renderModal();

    await user.click(
      screen.getByRole("button", { name: "このアイテムを削除する" }),
    );
    await user.click(screen.getByRole("button", { name: "削除する" }));

    await waitFor(() =>
      expect(deleteMealItem).toHaveBeenCalledWith({ itemId: "item-1" }),
    );
    expect(onClose).toHaveBeenCalled();
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("削除しました"),
    );
  });

  it("AC-R-5: when deleting fails an error naming the item is shown", async () => {
    const user = userEvent.setup();
    deleteMealItem.mockResolvedValue({ ok: false });
    renderModal();

    await user.click(
      screen.getByRole("button", { name: "このアイテムを削除する" }),
    );
    await user.click(screen.getByRole("button", { name: "削除する" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "「サラダチキン」の削除に失敗しました",
      ),
    );
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});
