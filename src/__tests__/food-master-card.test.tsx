import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FoodMasterCard } from "@/components/features/food-masters/components/food-master-card";
import type { FoodMaster } from "@/components/features/food-masters/types/food-master";

afterEach(() => {
  cleanup();
});

/** Create a mock FoodMaster */
const createFoodMaster = (overrides: Partial<FoodMaster> = {}): FoodMaster => ({
  id: "fm-1",
  userId: "user-1",
  name: "サラダチキン",
  brand: null,
  category: null,
  calories: 110,
  protein: 23.8,
  fat: 1.2,
  carbs: 0.3,
  defaultPrice: null,
  notes: null,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("FoodMasterCard", () => {
  it("displays the food master name", () => {
    render(
      <FoodMasterCard foodMaster={createFoodMaster()} onClick={vi.fn()} />,
    );
    expect(screen.getByText("サラダチキン")).toBeInTheDocument();
  });

  it("displays the calories", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster({ calories: 250 })}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText("250")).toBeInTheDocument();
    expect(screen.getByText("kcal")).toBeInTheDocument();
  });

  it("displays PFC values", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster({
          protein: 20.5,
          fat: 8.3,
          carbs: 15.0,
        })}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText(/P:20\.5/)).toBeInTheDocument();
    expect(screen.getByText(/F:8\.3/)).toBeInTheDocument();
    expect(screen.getByText(/C:15\.0/)).toBeInTheDocument();
  });

  it("displays brand when provided", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster({ brand: "セブンイレブン" })}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText("セブンイレブン")).toBeInTheDocument();
  });

  it("does not display brand when null", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster({ brand: null })}
        onClick={vi.fn()}
      />,
    );
    expect(screen.queryByText("セブンイレブン")).not.toBeInTheDocument();
  });

  it("displays category badge when provided", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster({ category: "bento" })}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText("弁当")).toBeInTheDocument();
  });

  it("does not display category badge when null", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster({ category: null })}
        onClick={vi.fn()}
      />,
    );
    // No badge should exist
    expect(screen.queryByText("弁当")).not.toBeInTheDocument();
  });

  it("displays price when provided", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster({ defaultPrice: 298 })}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText("¥298")).toBeInTheDocument();
  });

  it("does not display price when null", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster({ defaultPrice: null })}
        onClick={vi.fn()}
      />,
    );
    expect(screen.queryByText(/¥/)).not.toBeInTheDocument();
  });

  it("calls onClick when card is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <FoodMasterCard foodMaster={createFoodMaster()} onClick={onClick} />,
    );

    await user.click(screen.getByText("サラダチキン"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("rounds calories to nearest integer", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster({ calories: 99.7 })}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText("100")).toBeInTheDocument();
  });
});
