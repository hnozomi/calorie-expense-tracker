import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PfcInputCard } from "@/components/ui/pfc-display/pfc-input-card";

afterEach(() => {
  cleanup();
});

describe("PfcInputCard", () => {
  it.each([
    ["protein", "P (g)"],
    ["fat", "F (g)"],
    ["carbs", "C (g)"],
  ] as const)("S-05・S-08a: %s の欄はラベル「%s」で取れる数の入力欄", (nutrient, label) => {
    render(<PfcInputCard id={`fm-${nutrient}`} nutrient={nutrient} />);

    const field = screen.getByLabelText(label);
    expect(field).toHaveAttribute("type", "number");
    expect(field).toHaveAttribute("inputmode", "decimal");
  });

  it("02 バリデーション: エラーがあれば欄の下に出し、無ければ出さない", () => {
    const { rerender } = render(<PfcInputCard id="p" nutrient="protein" />);
    expect(
      screen.queryByText("0以上で入力してください"),
    ).not.toBeInTheDocument();

    rerender(
      <PfcInputCard
        id="p"
        nutrient="protein"
        error="0以上で入力してください"
      />,
    );
    expect(screen.getByText("0以上で入力してください")).toBeInTheDocument();
  });

  it("02 バリデーション: エラーの文は欄に結び付き(aria-describedby)、欄はエラーの状態(aria-invalid)になる", () => {
    const { rerender } = render(<PfcInputCard id="p" nutrient="protein" />);
    const field = screen.getByLabelText("P (g)");
    expect(field).not.toHaveAttribute("aria-invalid", "true");
    expect(field).not.toHaveAccessibleDescription();

    rerender(
      <PfcInputCard
        id="p"
        nutrient="protein"
        error="0以上で入力してください"
      />,
    );

    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription("0以上で入力してください");
  });

  it("S-05・S-08a: 入力欄の属性(react-hook-form の register など)はそのまま渡る", async () => {
    const onChange = vi.fn();
    render(
      <PfcInputCard id="f" nutrient="fat" name="fat" onChange={onChange} />,
    );

    const field = screen.getByLabelText("F (g)");
    await userEvent.type(field, "5");

    expect(field).toHaveAttribute("name", "fat");
    expect(onChange).toHaveBeenCalled();
  });
});
