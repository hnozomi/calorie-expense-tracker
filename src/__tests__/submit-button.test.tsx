import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SubmitButton } from "@/components/ui/button/submit-button";

afterEach(() => {
  cleanup();
});

describe("SubmitButton", () => {
  it("02 ローディング: 保存していない間は、渡した文言の送信ボタンで押せる", () => {
    render(<SubmitButton isPending={false}>変更を保存</SubmitButton>);

    const button = screen.getByRole("button", { name: "変更を保存" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toBeEnabled();
  });

  it("02 ローディング: 保存している間は「保存中...」になり、押せない(二重送信を防ぐ)", () => {
    render(<SubmitButton isPending>変更を保存</SubmitButton>);

    expect(
      screen.queryByRole("button", { name: "変更を保存" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /保存中/ })).toBeDisabled();
  });

  it("ボタンの属性(class など)はそのまま渡る", () => {
    render(
      <SubmitButton isPending={false} className="w-full" form="recipe-form">
        登録する
      </SubmitButton>,
    );

    const button = screen.getByRole("button", { name: "登録する" });
    expect(button).toHaveClass("w-full");
    expect(button).toHaveAttribute("form", "recipe-form");
  });
});
