import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DateNavigator } from "@/components/features/meals/components/date-navigator";
import { selectedDateAtom } from "@/components/features/meals/stores/date-atom";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

afterEach(() => {
  cleanup();
  replaceMock.mockClear();
});

/** Wrap component with Jotai store provider */
const renderWithStore = (store: ReturnType<typeof createStore>) => {
  return render(
    <Provider store={store}>
      <DateNavigator />
    </Provider>,
  );
};

describe("DateNavigator", () => {
  it("displays '今日' when the selected date is today", () => {
    const store = createStore();
    renderWithStore(store);
    expect(screen.getByText("今日")).toBeInTheDocument();
  });

  it("displays formatted date when not today", () => {
    const store = createStore();
    store.set(selectedDateAtom, "2026-03-15");
    renderWithStore(store);
    // March 15, 2026 is a Sunday (日)
    expect(screen.getByText("3/15（日）")).toBeInTheDocument();
  });

  it("navigates to previous day when left arrow is clicked", async () => {
    const user = userEvent.setup();
    const store = createStore();
    store.set(selectedDateAtom, "2026-03-21");
    renderWithStore(store);

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);

    expect(store.get(selectedDateAtom)).toBe("2026-03-20");
  });

  it("navigates to next day when right arrow is clicked", async () => {
    const user = userEvent.setup();
    const store = createStore();
    store.set(selectedDateAtom, "2026-03-21");
    renderWithStore(store);

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[1]);

    expect(store.get(selectedDateAtom)).toBe("2026-03-22");
  });

  it("displays '今日' after navigating back to today", async () => {
    const user = userEvent.setup();
    const store = createStore();
    renderWithStore(store);

    expect(screen.getByText("今日")).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    // Go to previous day
    await user.click(buttons[0]);
    expect(screen.queryByText("今日")).not.toBeInTheDocument();

    // Go back to today
    await user.click(buttons[1]);
    expect(screen.getByText("今日")).toBeInTheDocument();
  });
});
