import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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
      <FoodMasterCard
        foodMaster={createFoodMaster()}
        href="/other/food-masters/fm-1"
      />,
    );
    expect(screen.getByText("サラダチキン")).toBeInTheDocument();
  });

  it("displays the calories", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster({ calories: 250 })}
        href="/other/food-masters/fm-1"
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
        href="/other/food-masters/fm-1"
      />,
    );
    expect(screen.getByText(/P 20\.5/)).toBeInTheDocument();
    expect(screen.getByText(/F 8\.3/)).toBeInTheDocument();
    expect(screen.getByText(/C 15\.0/)).toBeInTheDocument();
  });

  it("displays brand when provided", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster({ brand: "セブンイレブン" })}
        href="/other/food-masters/fm-1"
      />,
    );
    expect(screen.getByText("セブンイレブン")).toBeInTheDocument();
  });

  it("does not display brand when null", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster({ brand: null })}
        href="/other/food-masters/fm-1"
      />,
    );
    expect(screen.queryByText("セブンイレブン")).not.toBeInTheDocument();
  });

  it("displays category badge when provided", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster({ category: "bento" })}
        href="/other/food-masters/fm-1"
      />,
    );
    expect(screen.getByText("弁当")).toBeInTheDocument();
  });

  it("does not display category badge when null", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster({ category: null })}
        href="/other/food-masters/fm-1"
      />,
    );
    // No badge should exist
    expect(screen.queryByText("弁当")).not.toBeInTheDocument();
  });

  it("displays price when provided", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster({ defaultPrice: 298 })}
        href="/other/food-masters/fm-1"
      />,
    );
    expect(screen.getByText("298")).toBeInTheDocument();
    expect(screen.getByText("¥")).toBeInTheDocument();
  });

  it("does not display price when null", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster({ defaultPrice: null })}
        href="/other/food-masters/fm-1"
      />,
    );
    expect(screen.queryByText(/¥/)).not.toBeInTheDocument();
  });

  it("renders a link to the detail page", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster()}
        href="/other/food-masters/fm-1"
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/other/food-masters/fm-1");
  });

  it("rounds calories to nearest integer", () => {
    render(
      <FoodMasterCard
        foodMaster={createFoodMaster({ calories: 99.7 })}
        href="/other/food-masters/fm-1"
      />,
    );
    expect(screen.getByText("100")).toBeInTheDocument();
  });
});
