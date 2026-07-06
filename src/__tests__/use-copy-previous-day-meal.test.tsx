import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCopyPreviousDayMeal } from "@/components/features/meals/hooks/use-copy-previous-day-meal";

/** Previous-day fetch result, configured per test */
const mockMaybeSingle = vi.fn();
/** Upsert of today's meal row */
const mockSingle = vi.fn();
const mockRpc = vi.fn();
const mockFrom = vi.fn(() => ({
  select: () => ({
    eq: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }),
  }),
  upsert: () => ({ select: () => ({ single: mockSingle }) }),
}));

vi.mock("@/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks")>()),
  useSupabase: () => ({
    from: mockFrom,
    auth: {
      getUser: async () => ({ data: { user: { id: "user-1" } } }),
    },
    rpc: mockRpc,
  }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

const previousItemRow = (overrides: Record<string, unknown> = {}) => ({
  name: "ラーメン",
  calories: 600,
  protein: 20,
  fat: 18,
  carbs: 80,
  cost: 900,
  source_type: "manual",
  food_master_id: null,
  recipe_id: null,
  set_menu_id: null,
  sort_order: 0,
  ...overrides,
});

const renderCopyHook = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderHook(() => useCopyPreviousDayMeal(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
};

describe("useCopyPreviousDayMeal", () => {
  it("前日の記録が無いときは0を返し、登録処理を呼ばない", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const { result } = renderCopyHook();

    const copiedCount = await result.current.mutateAsync({
      date: "2026-07-07",
      mealType: "dinner",
    });

    expect(copiedCount).toBe(0);
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockSingle).not.toHaveBeenCalled();
  });

  it("前日のアイテムを件数分コピーし、フィールドをRPCへ引き継ぐ", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: "meal-yesterday",
        meal_items: [
          previousItemRow({ recipe_id: "recipe-1", source_type: "recipe" }),
        ],
      },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: { id: "meal-today" }, error: null });
    mockRpc.mockResolvedValue({ error: null });
    const { result } = renderCopyHook();

    const copiedCount = await result.current.mutateAsync({
      date: "2026-07-07",
      mealType: "dinner",
    });

    expect(copiedCount).toBe(1);
    expect(mockRpc).toHaveBeenCalledWith("register_meal_items", {
      p_meal_id: "meal-today",
      p_items: [
        expect.objectContaining({
          name: "ラーメン",
          calories: 600,
          cost: 900,
          source_type: "recipe",
          recipe_id: "recipe-1",
        }),
      ],
    });
  });

  it("アイテムはsort_order順でコピーされる", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: "meal-yesterday",
        meal_items: [
          previousItemRow({ name: "二品目", sort_order: 1 }),
          previousItemRow({ name: "一品目", sort_order: 0 }),
        ],
      },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: { id: "meal-today" }, error: null });
    mockRpc.mockResolvedValue({ error: null });
    const { result } = renderCopyHook();

    await result.current.mutateAsync({ date: "2026-07-07", mealType: "lunch" });

    const registeredItems = mockRpc.mock.calls[0][1].p_items;
    expect(registeredItems.map((item: { name: string }) => item.name)).toEqual([
      "一品目",
      "二品目",
    ]);
  });

  it("前日データの取得に失敗したときはエラーになる", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: "network error" },
    });
    const { result } = renderCopyHook();

    await expect(
      result.current.mutateAsync({ date: "2026-07-07", mealType: "dinner" }),
    ).rejects.toMatchObject({ message: "network error" });

    expect(mockRpc).not.toHaveBeenCalled();
  });
});
