import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DateNavigator } from "@/components/features/meals/components/date-navigator";

const routerPush = vi.fn();
const routerReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, replace: routerReplace }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const TODAY = "2026-10-20";

describe("DateNavigator", () => {
  it("S-01: shows 今日 when the day on screen is today", () => {
    render(<DateNavigator date={TODAY} today={TODAY} />);
    expect(screen.getByText("今日")).toBeInTheDocument();
  });

  it("S-01: shows the day as M/D（曜） when it is not today", () => {
    // 2026-03-15 is a Sunday
    render(<DateNavigator date="2026-03-15" today={TODAY} />);
    expect(screen.getByText("3/15（日）")).toBeInTheDocument();
    expect(screen.queryByText("今日")).not.toBeInTheDocument();
  });

  it("AC-R-3: the previous day is a link to /home?date= of the day before", () => {
    render(<DateNavigator date="2026-03-21" today={TODAY} />);
    expect(screen.getByRole("link", { name: "前の日" })).toHaveAttribute(
      "href",
      "/home?date=2026-03-20",
    );
  });

  it("AC-R-3: the next day is a link to /home?date= of the day after", () => {
    render(<DateNavigator date="2026-03-21" today={TODAY} />);
    expect(screen.getByRole("link", { name: "次の日" })).toHaveAttribute(
      "href",
      "/home?date=2026-03-22",
    );
  });

  it("AC-R-3: the previous day crosses the month boundary", () => {
    render(<DateNavigator date="2026-03-01" today={TODAY} />);
    expect(screen.getByRole("link", { name: "前の日" })).toHaveAttribute(
      "href",
      "/home?date=2026-02-28",
    );
  });

  it("AC-R-3: from the day before today, the next day goes back to /home (today needs no ?date=)", () => {
    render(<DateNavigator date="2026-10-19" today={TODAY} />);
    expect(screen.getByRole("link", { name: "次の日" })).toHaveAttribute(
      "href",
      "/home",
    );
  });

  it("S-01: on another day, 今日へ links back to today's /home", () => {
    render(<DateNavigator date="2026-03-15" today={TODAY} />);
    expect(screen.getByRole("link", { name: "今日へ" })).toHaveAttribute(
      "href",
      "/home",
    );
  });

  it("S-01: on today there is no 今日へ link", () => {
    render(<DateNavigator date={TODAY} today={TODAY} />);
    expect(
      screen.queryByRole("link", { name: "今日へ" }),
    ).not.toBeInTheDocument();
  });

  it("AC-R-3: picking a day in the date input pushes /home?date= of that day onto the history (ui-tech §phase 2: router.push)", () => {
    render(<DateNavigator date={TODAY} today={TODAY} />);
    fireEvent.change(screen.getByLabelText("日付を選択"), {
      target: { value: "2026-10-05" },
    });
    expect(routerPush).toHaveBeenCalledWith("/home?date=2026-10-05");
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("AC-R-3: picking today in the date input pushes /home (today needs no ?date=)", () => {
    render(<DateNavigator date="2026-10-05" today={TODAY} />);
    fireEvent.change(screen.getByLabelText("日付を選択"), {
      target: { value: TODAY },
    });
    expect(routerPush).toHaveBeenCalledWith("/home");
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("AC-R-3: clearing the date input does not move", () => {
    render(<DateNavigator date={TODAY} today={TODAY} />);
    fireEvent.change(screen.getByLabelText("日付を選択"), {
      target: { value: "" },
    });
    expect(routerReplace).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
  });
});
