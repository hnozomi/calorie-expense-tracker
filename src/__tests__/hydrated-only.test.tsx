import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { HydratedOnly } from "@/components/features/layout/hydrated-only";

afterEach(() => {
  cleanup();
});

describe("HydratedOnly", () => {
  it("prerendered HTML holds only the placeholder, so no data fetched at build time is baked in", () => {
    const html = renderToString(
      <HydratedOnly fallback={<p>読み込み中の形</p>}>
        <p>データ</p>
      </HydratedOnly>,
    );

    expect(html).toContain("読み込み中の形");
    expect(html).not.toContain("データ");
  });

  it("shows the children once the page has hydrated in the browser", () => {
    render(
      <HydratedOnly fallback={<p>読み込み中の形</p>}>
        <p>データ</p>
      </HydratedOnly>,
    );

    expect(screen.getByText("データ")).toBeInTheDocument();
    expect(screen.queryByText("読み込み中の形")).not.toBeInTheDocument();
  });
});
