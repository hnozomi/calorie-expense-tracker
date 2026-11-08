import { renderHook } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { usePendingMealItem } from "@/components/features/meals/hooks/use-pending-meal-item";
import type {
  MealItemFormInput,
  PendingMealItemCollector,
} from "@/components/features/meals/types/meal";

const filled: MealItemFormInput = {
  name: "サラダチキン",
  calories: "120",
  protein: "25",
  fat: "1.5",
  carbs: "0.3",
};

const renderWith = (values: MealItemFormInput) => {
  const ref = createRef<PendingMealItemCollector | null>();
  // The hook only calls getValues() without arguments
  const getValues = (() => values) as never;
  const hook = renderHook(() => usePendingMealItem(ref, getValues));
  return { ref, ...hook };
};

describe("usePendingMealItem", () => {
  it("名前のある入力は、数値にした値を返す", () => {
    const { ref } = renderWith(filled);

    expect(ref.current?.()).toEqual({
      name: "サラダチキン",
      calories: 120,
      protein: 25,
      fat: 1.5,
      carbs: 0.3,
    });
  });

  it("名前が空白だけなら null を返す", () => {
    const { ref } = renderWith({ ...filled, name: "  " });

    expect(ref.current?.()).toBeNull();
  });

  it("数値として不正な入力なら null を返す", () => {
    const { ref } = renderWith({ ...filled, calories: "-1" });

    expect(ref.current?.()).toBeNull();
  });

  it("フォームが消えると ref を空に戻す", () => {
    const { ref, unmount } = renderWith(filled);

    unmount();

    expect(ref.current).toBeNull();
  });
});
