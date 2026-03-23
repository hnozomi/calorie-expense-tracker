import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MealItemEditModal } from "@/components/features/meals/components/meal-item-edit-modal";
import type { MealItem } from "@/components/features/meals/types/meal";

/** Mock vaul Drawer as a simple div wrapper to avoid jsdom pointer/transform issues */
vi.mock("vaul", () => {
  const Drawer = ({
    children,
    open,
  }: {
    children: ReactNode;
    open?: boolean;
  }) => (open ? <div data-testid="drawer">{children}</div> : null);
  const Content = ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  );
  const Overlay = () => <div />;
  const Portal = ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  );
  const Title = ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  );
  Drawer.Root = Drawer;
  Drawer.Portal = Portal;
  Drawer.Overlay = Overlay;
  Drawer.Content = Content;
  Drawer.Title = Title;
  Drawer.Close = ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  );
  Drawer.Handle = () => <div />;
  Drawer.Description = ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  );
  return { Drawer };
});

const mockUpdateMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();

vi.mock("@/components/features/meals/hooks/use-update-meal-item", () => ({
  useUpdateMealItem: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
}));
vi.mock("@/components/features/meals/hooks/use-delete-meal-item", () => ({
  useDeleteMealItem: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const createMealItem = (overrides: Partial<MealItem> = {}): MealItem => ({
  id: "item-1",
  mealId: "meal-1",
  name: "サラダチキン",
  calories: 120,
  protein: 25,
  fat: 2,
  carbs: 1,
  cost: 250,
  sourceType: "manual",
  recipeId: null,
  foodMasterId: null,
  setMenuId: null,
  servingQuantity: 1,
  sortOrder: 0,
  createdAt: "2026-03-21T00:00:00Z",
  updatedAt: "2026-03-21T00:00:00Z",
  ...overrides,
});

describe("MealItemEditModal", () => {
  it("renders nothing when item is null", () => {
    const { container } = render(
      <MealItemEditModal
        item={null}
        date="2026-03-21"
        isOpen={false}
        onClose={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("displays the modal title and source type badge", () => {
    const item = createMealItem({ sourceType: "manual" });
    render(
      <MealItemEditModal
        item={item}
        date="2026-03-21"
        isOpen={true}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("アイテム編集")).toBeInTheDocument();
    expect(screen.getByText("手動")).toBeInTheDocument();
  });

  it("displays OCR badge for OCR source type", () => {
    const item = createMealItem({ sourceType: "ocr" });
    render(
      <MealItemEditModal
        item={item}
        date="2026-03-21"
        isOpen={true}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("OCR")).toBeInTheDocument();
  });

  it("shows delete confirmation when delete link is clicked", async () => {
    const user = userEvent.setup();
    const item = createMealItem({ name: "テストアイテム" });
    render(
      <MealItemEditModal
        item={item}
        date="2026-03-21"
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByText("このアイテムを削除する"));

    expect(
      screen.getByText("「テストアイテム」を削除しますか？"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "キャンセル" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "削除する" }),
    ).toBeInTheDocument();
  });

  it("hides delete confirmation when cancel is clicked", async () => {
    const user = userEvent.setup();
    const item = createMealItem({ name: "テストアイテム" });
    render(
      <MealItemEditModal
        item={item}
        date="2026-03-21"
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByText("このアイテムを削除する"));
    expect(
      screen.getByText("「テストアイテム」を削除しますか？"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(
      screen.queryByText("「テストアイテム」を削除しますか？"),
    ).not.toBeInTheDocument();
  });

  it("calls delete mutation when confirmed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const item = createMealItem();
    mockDeleteMutateAsync.mockResolvedValue(undefined);

    render(
      <MealItemEditModal
        item={item}
        date="2026-03-21"
        isOpen={true}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByText("このアイテムを削除する"));
    await user.click(screen.getByRole("button", { name: "削除する" }));

    expect(mockDeleteMutateAsync).toHaveBeenCalledWith({
      itemId: "item-1",
      date: "2026-03-21",
    });
  });
});
