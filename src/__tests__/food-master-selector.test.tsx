import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FoodMasterSelector } from "@/components/features/meals/components/food-master-selector";

/** Mock the useFoodMasters hook */
const mockFoodMasters = vi.fn();
vi.mock("@/components/features/food-masters/hooks/use-food-masters", () => ({
  useFoodMasters: (...args: unknown[]) => mockFoodMasters(...args),
}));

/** Mock useDebounce to return value immediately */
vi.mock("@/hooks", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/hooks")>();
  return {
    ...original,
    useDebounce: (value: unknown) => value,
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const sampleFoodMasters = [
  {
    id: "fm-1",
    name: "サラダチキン",
    brand: "セブンイレブン",
    calories: 110,
    protein: 23.8,
    fat: 1.2,
    carbs: 0.3,
    defaultPrice: 250,
  },
  {
    id: "fm-2",
    name: "おにぎり（鮭）",
    brand: null,
    calories: 180,
    protein: 4.5,
    fat: 1.0,
    carbs: 38.0,
    defaultPrice: null,
  },
];

describe("FoodMasterSelector", () => {
  it("displays loading skeletons while fetching", () => {
    mockFoodMasters.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(
      <FoodMasterSelector onSelect={vi.fn()} />,
    );
    // 3 skeleton elements
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(3);
  });

  it("displays food master items when loaded", () => {
    mockFoodMasters.mockReturnValue({
      data: sampleFoodMasters,
      isLoading: false,
    });
    render(<FoodMasterSelector onSelect={vi.fn()} />);
    expect(screen.getByText("サラダチキン")).toBeInTheDocument();
    expect(screen.getByText("おにぎり（鮭）")).toBeInTheDocument();
  });

  it("displays brand when available", () => {
    mockFoodMasters.mockReturnValue({
      data: sampleFoodMasters,
      isLoading: false,
    });
    render(<FoodMasterSelector onSelect={vi.fn()} />);
    expect(screen.getByText("セブンイレブン")).toBeInTheDocument();
  });

  it("displays calories for each item", () => {
    mockFoodMasters.mockReturnValue({
      data: sampleFoodMasters,
      isLoading: false,
    });
    render(<FoodMasterSelector onSelect={vi.fn()} />);
    expect(screen.getByText(/110 kcal/)).toBeInTheDocument();
    expect(screen.getByText(/180 kcal/)).toBeInTheDocument();
  });

  it("displays empty message when no food masters exist", () => {
    mockFoodMasters.mockReturnValue({ data: [], isLoading: false });
    render(<FoodMasterSelector onSelect={vi.fn()} />);
    expect(screen.getByText("食品マスタが未登録です")).toBeInTheDocument();
  });

  it("displays search-specific empty message when search yields no results", async () => {
    const user = userEvent.setup();
    mockFoodMasters.mockReturnValue({ data: [], isLoading: false });
    render(<FoodMasterSelector onSelect={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText("食品名で検索...");
    await user.type(searchInput, "存在しない食品");

    expect(screen.getByText("該当する食品がありません")).toBeInTheDocument();
  });

  it("calls onSelect with correct values when item is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    mockFoodMasters.mockReturnValue({
      data: sampleFoodMasters,
      isLoading: false,
    });
    render(<FoodMasterSelector onSelect={onSelect} />);

    await user.click(screen.getByText("サラダチキン"));

    expect(onSelect).toHaveBeenCalledWith({
      name: "サラダチキン",
      calories: 110,
      protein: 23.8,
      fat: 1.2,
      carbs: 0.3,
      cost: 250,
    });
  });

  it("passes undefined for cost when defaultPrice is null", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    mockFoodMasters.mockReturnValue({
      data: sampleFoodMasters,
      isLoading: false,
    });
    render(<FoodMasterSelector onSelect={onSelect} />);

    await user.click(screen.getByText("おにぎり（鮭）"));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ cost: undefined }),
    );
  });

  it("has a search input", () => {
    mockFoodMasters.mockReturnValue({ data: [], isLoading: false });
    render(<FoodMasterSelector onSelect={vi.fn()} />);
    expect(
      screen.getByPlaceholderText("食品名で検索..."),
    ).toBeInTheDocument();
  });
});
