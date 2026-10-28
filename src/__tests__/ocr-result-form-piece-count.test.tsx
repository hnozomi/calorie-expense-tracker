import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OcrResultForm } from "@/components/features/ocr/components/ocr-result-form";
import type { OcrNutritionResult } from "@/components/features/ocr/types/ocr";

afterEach(() => {
  cleanup();
});

// A label giving values for one piece (1個当たり) of an 8-piece pack (8個入り)
const perPieceResult: OcrNutritionResult = {
  name: "餃子",
  calories: 40,
  protein: 1.5,
  fat: 2.1,
  carbs: 4.3,
  pieceCount: 8,
};

const renderForm = (ocrResult: OcrNutritionResult = perPieceResult) => {
  const onAdd = vi.fn();
  const onSaveToMaster = vi.fn();
  render(
    <OcrResultForm
      ocrResult={ocrResult}
      onAdd={onAdd}
      onSaveToMaster={onSaveToMaster}
    />,
  );
  return { user: userEvent.setup(), onAdd, onSaveToMaster };
};

const nutritionFields = () => ({
  calories: screen.getByLabelText("カロリー (kcal)"),
  protein: screen.getByLabelText("P (g)"),
  fat: screen.getByLabelText("F (g)"),
  carbs: screen.getByLabelText("C (g)"),
});

const expectFields = (expected: {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}) => {
  const fields = nutritionFields();
  expect(fields.calories).toHaveValue(expected.calories);
  expect(fields.protein).toHaveValue(expected.protein);
  expect(fields.fat).toHaveValue(expected.fat);
  expect(fields.carbs).toHaveValue(expected.carbs);
};

const decreaseButton = () =>
  screen.getByRole("button", { name: "食べた数を減らす" });
const increaseButton = () =>
  screen.getByRole("button", { name: "食べた数を増やす" });

describe("OcrResultForm の食べた数 (F-02 1個当たりの表示)", () => {
  describe("値がパッケージ全体のもの(pieceCount が null)", () => {
    const wholePackResult: OcrNutritionResult = {
      ...perPieceResult,
      pieceCount: null,
    };

    it("F-02: 食べた数は出さず、欄は表示の値のまま", () => {
      renderForm(wholePackResult);

      expect(screen.queryByText("食べた数")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "食べた数を減らす" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "食べた数を増やす" }),
      ).not.toBeInTheDocument();
      expectFields({ calories: 40, protein: 1.5, fat: 2.1, carbs: 4.3 });
    });

    it("F-02: 食品マスタに保存すると、表示の値をそのまま送る", async () => {
      const { user, onSaveToMaster } = renderForm(wholePackResult);

      await user.click(
        screen.getByRole("button", { name: "食品マスタに保存" }),
      );

      expect(onSaveToMaster).toHaveBeenCalledOnce();
      expect(onSaveToMaster.mock.calls[0][0]).toMatchObject({
        name: "餃子",
        calories: 40,
        protein: 1.5,
        fat: 2.1,
        carbs: 4.3,
      });
    });
  });

  describe("1個当たりで8個入り(pieceCount が 8)", () => {
    it("F-02: 食べた数と「1個あたり Nkcal・M個入り」を出す", () => {
      renderForm();

      expect(screen.getByText("食べた数")).toBeInTheDocument();
      expect(screen.getByText("1個あたり 40kcal・8個入り")).toBeInTheDocument();
    });

    it("F-02: 食べた数は8個から始まり、欄は1個当たり × 8", () => {
      renderForm();

      expect(screen.getByText("8個")).toBeInTheDocument();
      expectFields({ calories: 320, protein: 12, fat: 16.8, carbs: 34.4 });
    });

    it("F-02: 8個のときは増やせず、減らせる", () => {
      renderForm();

      expect(increaseButton()).toBeDisabled();
      expect(decreaseButton()).toBeEnabled();
    });

    it("F-02: 減らすと食べた数が7個になり、欄は1個当たり × 7", async () => {
      const { user } = renderForm();

      await user.click(decreaseButton());

      expect(screen.getByText("7個")).toBeInTheDocument();
      expectFields({ calories: 280, protein: 10.5, fat: 14.7, carbs: 30.1 });
      expect(increaseButton()).toBeEnabled();
    });

    it("F-02: 1個まで減らすとそれ以上は減らせず、欄は1個当たりの値", async () => {
      const { user } = renderForm();

      for (let i = 0; i < 7; i++) {
        await user.click(decreaseButton());
      }

      expect(screen.getByText("1個")).toBeInTheDocument();
      expect(decreaseButton()).toBeDisabled();
      expectFields({ calories: 40, protein: 1.5, fat: 2.1, carbs: 4.3 });
    });

    it("F-02: 1個から増やすと2個になり、欄は1個当たり × 2", async () => {
      const { user } = renderForm();

      for (let i = 0; i < 7; i++) {
        await user.click(decreaseButton());
      }
      await user.click(increaseButton());

      expect(screen.getByText("2個")).toBeInTheDocument();
      expect(decreaseButton()).toBeEnabled();
      expectFields({ calories: 80, protein: 3, fat: 4.2, carbs: 8.6 });
    });

    it("F-02: カードに追加すると、食べた量(欄の値)を送る", async () => {
      const { user, onAdd } = renderForm();

      await user.click(decreaseButton());
      await user.click(screen.getByRole("button", { name: "カードに追加" }));

      await waitFor(() => {
        expect(onAdd).toHaveBeenCalledOnce();
      });
      expect(onAdd.mock.calls[0][0]).toMatchObject({
        name: "餃子",
        calories: 280,
        protein: 10.5,
        fat: 14.7,
        carbs: 30.1,
      });
    });

    it("F-02: 食品マスタに保存すると、欄の値を食べた数で割った1個分を送る", async () => {
      const { user, onSaveToMaster } = renderForm();

      await user.click(decreaseButton());
      await user.click(
        screen.getByRole("button", { name: "食品マスタに保存" }),
      );

      expect(onSaveToMaster).toHaveBeenCalledOnce();
      expect(onSaveToMaster.mock.calls[0][0]).toMatchObject({
        name: "餃子",
        calories: 40,
        protein: 1.5,
        fat: 2.1,
        carbs: 4.3,
      });
    });

    it("F-02: 欄を直してから食品マスタに保存すると、直した値を食べた数で割って送る", async () => {
      const { user, onSaveToMaster } = renderForm();

      for (let i = 0; i < 6; i++) {
        await user.click(decreaseButton());
      }
      const { calories } = nutritionFields();
      await user.clear(calories);
      await user.type(calories, "150");
      await user.click(
        screen.getByRole("button", { name: "食品マスタに保存" }),
      );

      expect(onSaveToMaster).toHaveBeenCalledOnce();
      expect(onSaveToMaster.mock.calls[0][0]).toMatchObject({
        calories: 75,
        protein: 1.5,
        fat: 2.1,
        carbs: 4.3,
      });
    });
  });
});
