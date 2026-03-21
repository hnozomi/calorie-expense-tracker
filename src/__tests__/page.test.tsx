import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Home from "@/app/page";

test("renders home page", () => {
  render(<Home />);
  expect(screen.getByText("Hello, World!")).toBeInTheDocument();
});
