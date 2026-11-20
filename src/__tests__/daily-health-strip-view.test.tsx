import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DailyHealthStripView } from "@/components/features/health/components/daily-health-strip-view";
import type { DailyHealth } from "@/components/features/health/types/daily-health";

// The band under the home summary (phase 1 design 3-1, task T-5). DailyHealthStrip only awaits the read and hands
// the result here, so the drawing is checked on this part

afterEach(() => {
  cleanup();
});

const EMPTY_DAY: DailyHealth = {
  weightKg: null,
  weightChange: null,
  bodyFatPct: null,
  steps: null,
  activeEnergyKcal: null,
};

const bandText = () =>
  screen.getByRole("region", { name: "健康データ" }).textContent;

describe("DailyHealthStripView", () => {
  it("T-5: 値がある日は 体重（前日比）・体脂肪・歩数 を1本の帯に出す", () => {
    render(
      <DailyHealthStripView
        health={{
          weightKg: 82.4,
          weightChange: {
            diffKg: -0.3,
            comparedDate: "2026-11-18",
            isPreviousDay: true,
          },
          bodyFatPct: 21.3,
          steps: 8214,
          activeEnergyKcal: 420,
        }}
      />,
    );
    expect(bandText()).toBe(
      "体重 82.4kg（前日比 −0.3）・体脂肪 21.3%・歩数 8,214",
    );
  });

  it("T-5: 前日が欠測で前の日と比べたときは「前回比（M/D）」", () => {
    render(
      <DailyHealthStripView
        health={{
          ...EMPTY_DAY,
          weightKg: 82.4,
          weightChange: {
            diffKg: 0.3,
            comparedDate: "2026-11-17",
            isPreviousDay: false,
          },
        }}
      />,
    );
    expect(
      screen.getByText("82.4kg（前回比（11/17） +0.3）"),
    ).toBeInTheDocument();
  });

  it("T-5: 比べる体重が無いときは比較を出さない", () => {
    render(<DailyHealthStripView health={{ ...EMPTY_DAY, weightKg: 82.4 }} />);
    expect(screen.getByText("82.4kg")).toBeInTheDocument();
    expect(bandText()).not.toMatch(/前日比|前回比/);
  });

  it("T-5: 取り込みの無い日は、どの項目も「未取得」", () => {
    render(<DailyHealthStripView health={EMPTY_DAY} />);
    expect(bandText()).toBe("体重 未取得・体脂肪 未取得・歩数 未取得");
  });

  it("T-5: 0 歩は「未取得」ではなく 0 と出す", () => {
    render(<DailyHealthStripView health={{ ...EMPTY_DAY, steps: 0 }} />);
    expect(bandText()).toBe("体重 未取得・体脂肪 未取得・歩数 0");
  });

  it("T-5: 読み込みに失敗したら、値の代わりに「—」を出す", () => {
    render(<DailyHealthStripView health={null} />);
    expect(bandText()).toBe("体重 —・体脂肪 —・歩数 —");
    expect(bandText()).not.toMatch(/未取得/);
  });
});
