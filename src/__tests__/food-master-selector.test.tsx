import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import { FoodMasterSelector } from "@/components/features/meals/components/food-master-selector";

afterEach(() => {
  cleanup();
});

const createFoodMaster = (overrides: Partial<FoodMaster> = {}): FoodMaster => ({
  id: "fm-1",
  userId: "user-1",
  name: "サラダチキン",
  brand: "セブンイレブン",
  category: null,
  calories: 110,
  protein: 23.8,
  fat: 1.2,
  carbs: 0.3,
  defaultPrice: 250,
  notes: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

const sampleFoodMasters = [
  createFoodMaster(),
  createFoodMaster({
    id: "fm-2",
    name: "おにぎり（鮭）",
    brand: null,
    calories: 180,
    protein: 4.5,
    fat: 1.0,
    carbs: 38.0,
    defaultPrice: null,
  }),
];

const searchBox = () =>
  screen.getByPlaceholderText("食品名・ブランドで検索...");

describe("FoodMasterSelector", () => {
  it("S-02: shows every food master it receives, with its brand and calories", () => {
    render(
      <FoodMasterSelector foodMasters={sampleFoodMasters} onSelect={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", {
        name: /サラダチキン.*セブンイレブン.*110 kcal/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /おにぎり（鮭）.*180 kcal/ }),
    ).toBeInTheDocument();
  });

  it("S-02: an empty list says no food master is registered", () => {
    render(<FoodMasterSelector foodMasters={[]} onSelect={vi.fn()} />);
    expect(screen.getByText("食品マスタが未登録です")).toBeInTheDocument();
  });

  it("S-08: typing a food name narrows the list without reading again", async () => {
    const user = userEvent.setup();
    render(
      <FoodMasterSelector foodMasters={sampleFoodMasters} onSelect={vi.fn()} />,
    );

    await user.type(searchBox(), "おにぎり");

    expect(
      screen.getByRole("button", { name: /おにぎり（鮭）/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /サラダチキン/ }),
    ).not.toBeInTheDocument();
  });

  it("S-08: typing a brand name finds the food masters of that brand", async () => {
    const user = userEvent.setup();
    render(
      <FoodMasterSelector foodMasters={sampleFoodMasters} onSelect={vi.fn()} />,
    );

    await user.type(searchBox(), "セブン");

    expect(
      screen.getByRole("button", { name: /サラダチキン/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /おにぎり（鮭）/ }),
    ).not.toBeInTheDocument();
  });

  it("S-08: a search with no match says nothing matched", async () => {
    const user = userEvent.setup();
    render(
      <FoodMasterSelector foodMasters={sampleFoodMasters} onSelect={vi.fn()} />,
    );

    await user.type(searchBox(), "存在しない食品");

    expect(screen.getByText("該当する食品がありません")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("S-02: tapping a food master passes its values and id", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <FoodMasterSelector
        foodMasters={sampleFoodMasters}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: /サラダチキン/ }));

    expect(onSelect).toHaveBeenCalledWith(
      {
        name: "サラダチキン",
        calories: 110,
        protein: 23.8,
        fat: 1.2,
        carbs: 0.3,
        cost: 250,
      },
      "fm-1",
    );
  });

  it("S-02: a food master without a default price passes no cost", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <FoodMasterSelector
        foodMasters={sampleFoodMasters}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: /おにぎり（鮭）/ }));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ cost: undefined }),
      "fm-2",
    );
  });
});
