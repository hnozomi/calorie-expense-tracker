import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SetMenuCard } from "@/components/features/set-menus/components/set-menu-card";
import type { SetMenu } from "@/components/features/set-menus/types/set-menu";

afterEach(() => {
  cleanup();
});

/** Create a mock SetMenu */
const createSetMenu = (overrides: Partial<SetMenu> = {}): SetMenu => ({
  id: "sm-1",
  userId: "user-1",
  name: "朝定食セット",
  totalCalories: 650,
  totalProtein: 35.5,
  totalFat: 15.2,
  totalCarbs: 80.3,
  totalCost: 450,
  deletedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  items: [
    {
      id: "item-1",
      setMenuId: "sm-1",
      name: "ご飯",
      recipeId: null,
      foodMasterId: "fm-1",
      calories: 250,
      protein: 4,
      fat: 0.5,
      carbs: 55,
      cost: 50,
      servingQuantity: 1,
      sortOrder: 0,
    },
    {
      id: "item-2",
      setMenuId: "sm-1",
      name: "味噌汁",
      recipeId: "r-1",
      foodMasterId: null,
      calories: 50,
      protein: 3,
      fat: 1.2,
      carbs: 5,
      cost: 30,
      servingQuantity: 1,
      sortOrder: 1,
    },
  ],
  ...overrides,
});

describe("SetMenuCard", () => {
  it("displays the set menu name", () => {
    render(<SetMenuCard setMenu={createSetMenu()} onClick={vi.fn()} />);
    expect(screen.getByText("朝定食セット")).toBeInTheDocument();
  });

  it("displays item names as badges", () => {
    render(<SetMenuCard setMenu={createSetMenu()} onClick={vi.fn()} />);
    expect(screen.getByText("ご飯")).toBeInTheDocument();
    expect(screen.getByText("味噌汁")).toBeInTheDocument();
  });

  it("displays total calories", () => {
    render(<SetMenuCard setMenu={createSetMenu()} onClick={vi.fn()} />);
    expect(screen.getByText("650")).toBeInTheDocument();
    expect(screen.getByText("kcal")).toBeInTheDocument();
  });

  it("displays total cost when greater than zero", () => {
    render(<SetMenuCard setMenu={createSetMenu()} onClick={vi.fn()} />);
    expect(screen.getByText("¥450")).toBeInTheDocument();
  });

  it("does not display cost when total cost is zero", () => {
    render(
      <SetMenuCard
        setMenu={createSetMenu({ totalCost: 0 })}
        onClick={vi.fn()}
      />,
    );
    expect(screen.queryByText(/¥/)).not.toBeInTheDocument();
  });

  it("displays PFC totals", () => {
    render(<SetMenuCard setMenu={createSetMenu()} onClick={vi.fn()} />);
    expect(screen.getByText(/P:35\.5/)).toBeInTheDocument();
    expect(screen.getByText(/F:15\.2/)).toBeInTheDocument();
    expect(screen.getByText(/C:80\.3/)).toBeInTheDocument();
  });

  it("calls onClick when card is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SetMenuCard setMenu={createSetMenu()} onClick={onClick} />);

    await user.click(screen.getByText("朝定食セット"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders with no items", () => {
    render(
      <SetMenuCard
        setMenu={createSetMenu({ items: [] })}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText("朝定食セット")).toBeInTheDocument();
    // No badges rendered
    expect(screen.queryByText("ご飯")).not.toBeInTheDocument();
  });

  it("rounds total calories to nearest integer", () => {
    render(
      <SetMenuCard
        setMenu={createSetMenu({ totalCalories: 649.7 })}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText("650")).toBeInTheDocument();
  });
});
