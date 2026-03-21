import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MealRegisterCard } from "@/components/features/meals/components/meal-register-card";
import type { MealItemDraft } from "@/components/features/meals/types/meal";

afterEach(() => {
  cleanup();
});

/** Create a mock draft item */
const createDraft = (
  overrides: Partial<MealItemDraft> = {},
): MealItemDraft => ({
  tempId: crypto.randomUUID(),
  name: "サラダチキン",
  calories: 120,
  protein: 25,
  fat: 2,
  carbs: 1,
  cost: 250,
  sourceType: "manual",
  ...overrides,
});

describe("MealRegisterCard", () => {
  it("returns null when items array is empty", () => {
    const { container } = render(
      <MealRegisterCard items={[]} onRemove={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("displays item count", () => {
    const items = [createDraft(), createDraft({ name: "おにぎり" })];
    render(<MealRegisterCard items={items} onRemove={vi.fn()} />);
    expect(screen.getByText(/登録予定（2件）/)).toBeInTheDocument();
  });

  it("displays each item name", () => {
    const items = [
      createDraft({ name: "サラダチキン", calories: 120 }),
      createDraft({ name: "おにぎり", calories: 200 }),
    ];
    render(<MealRegisterCard items={items} onRemove={vi.fn()} />);
    expect(screen.getByText("サラダチキン")).toBeInTheDocument();
    expect(screen.getByText("おにぎり")).toBeInTheDocument();
  });

  it("displays total calories and cost", () => {
    const items = [
      createDraft({ calories: 300, cost: 200 }),
      createDraft({ calories: 200, cost: 150 }),
    ];
    render(<MealRegisterCard items={items} onRemove={vi.fn()} />);
    expect(screen.getByText(/合計 500 kcal/)).toBeInTheDocument();
    expect(screen.getByText(/¥350/)).toBeInTheDocument();
  });

  it("treats null cost as 0 in total", () => {
    const items = [
      createDraft({ calories: 100, cost: 200 }),
      createDraft({ calories: 100, cost: undefined }),
    ];
    render(<MealRegisterCard items={items} onRemove={vi.fn()} />);
    expect(screen.getByText(/¥200/)).toBeInTheDocument();
  });

  it("calls onRemove with tempId when remove button is clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const item = createDraft({ name: "テスト" });
    render(<MealRegisterCard items={[item]} onRemove={onRemove} />);

    const removeButtons = screen.getAllByRole("button");
    await user.click(removeButtons[0]);

    expect(onRemove).toHaveBeenCalledWith(item.tempId);
  });
});
