import { describe, expect, it } from "vitest";
import type { HealthValueRow } from "@/components/features/health/types/daily-health";
import {
  buildDailyHealth,
  findWeightChange,
  pickHealthValue,
  toHealthValueRows,
} from "@/components/features/health/utils/daily-health";
import {
  formatSteps,
  formatWeightChange,
} from "@/components/features/health/utils/format-daily-health";

// The home band (phase 1 design 1-1 for the source priority, 3-1 and O-3 for the weight change, task T-5)

const row = (
  date: string,
  metric: HealthValueRow["metric"],
  source: HealthValueRow["source"],
  value: number,
): HealthValueRow => ({ date, metric, source, value });

const DAY = "2026-11-19";

describe("pickHealthValue (出所の優先順位)", () => {
  it("T-5: 体重は withings → apple_health → manual の順で選ぶ", () => {
    const all = [
      row(DAY, "weight_kg", "manual", 83),
      row(DAY, "weight_kg", "apple_health", 82.6),
      row(DAY, "weight_kg", "withings", 82.4),
    ];
    expect(pickHealthValue(all, DAY, "weight_kg")).toBe(82.4);
    expect(
      pickHealthValue(
        all.filter((r) => r.source !== "withings"),
        DAY,
        "weight_kg",
      ),
    ).toBe(82.6);
    expect(
      pickHealthValue(
        all.filter((r) => r.source === "manual"),
        DAY,
        "weight_kg",
      ),
    ).toBe(83);
  });

  it("T-5: 体脂肪率も withings → apple_health → manual の順", () => {
    const all = [
      row(DAY, "body_fat_pct", "apple_health", 22),
      row(DAY, "body_fat_pct", "withings", 21.3),
      row(DAY, "body_fat_pct", "manual", 20),
    ];
    expect(pickHealthValue(all, DAY, "body_fat_pct")).toBe(21.3);
    expect(
      pickHealthValue(
        all.filter((r) => r.source !== "withings"),
        DAY,
        "body_fat_pct",
      ),
    ).toBe(22);
  });

  it("T-5: 歩数は apple_health → withings → manual の順で選ぶ", () => {
    const all = [
      row(DAY, "steps", "withings", 7000),
      row(DAY, "steps", "manual", 5000),
      row(DAY, "steps", "apple_health", 8214),
    ];
    expect(pickHealthValue(all, DAY, "steps")).toBe(8214);
    expect(
      pickHealthValue(
        all.filter((r) => r.source !== "apple_health"),
        DAY,
        "steps",
      ),
    ).toBe(7000);
    expect(
      pickHealthValue(
        all.filter((r) => r.source === "manual"),
        DAY,
        "steps",
      ),
    ).toBe(5000);
  });

  it("T-5: 活動量も apple_health → withings → manual の順", () => {
    const all = [
      row(DAY, "active_energy_kcal", "withings", 300),
      row(DAY, "active_energy_kcal", "apple_health", 420),
    ];
    expect(pickHealthValue(all, DAY, "active_energy_kcal")).toBe(420);
  });

  it("T-5: その日・その項目の行が無ければ null（別の日・別の項目の行は使わない）", () => {
    const all = [
      row("2026-11-18", "weight_kg", "withings", 82.7),
      row(DAY, "body_fat_pct", "withings", 21.3),
    ];
    expect(pickHealthValue(all, DAY, "weight_kg")).toBeNull();
  });

  it("T-5: 0 歩は値として選ぶ（欠測にしない）", () => {
    expect(
      pickHealthValue([row(DAY, "steps", "apple_health", 0)], DAY, "steps"),
    ).toBe(0);
  });
});

describe("findWeightChange (前日比)", () => {
  it("T-5: 前日があれば前日と比べる", () => {
    expect(
      findWeightChange(
        [
          row(DAY, "weight_kg", "withings", 82.4),
          row("2026-11-18", "weight_kg", "withings", 82.7),
          row("2026-11-17", "weight_kg", "withings", 83.5),
        ],
        DAY,
      ),
    ).toEqual({
      diffKg: -0.3,
      comparedDate: "2026-11-18",
      isPreviousDay: true,
    });
  });

  it("T-5: 前日が欠測なら、7日以内でいちばん近い前の日と比べる", () => {
    expect(
      findWeightChange(
        [
          row(DAY, "weight_kg", "withings", 82.4),
          row("2026-11-17", "weight_kg", "withings", 82.1),
          row("2026-11-15", "weight_kg", "withings", 83),
        ],
        DAY,
      ),
    ).toEqual({
      diffKg: 0.3,
      comparedDate: "2026-11-17",
      isPreviousDay: false,
    });
  });

  it("T-5: ちょうど7日前の体重とは比べる", () => {
    expect(
      findWeightChange(
        [
          row(DAY, "weight_kg", "withings", 82.4),
          row("2026-11-12", "weight_kg", "withings", 82.9),
        ],
        DAY,
      ),
    ).toEqual({
      diffKg: -0.5,
      comparedDate: "2026-11-12",
      isPreviousDay: false,
    });
  });

  it("T-5: 7日以内に体重が無ければ比較を出さない（8日前は使わない）", () => {
    expect(
      findWeightChange(
        [
          row(DAY, "weight_kg", "withings", 82.4),
          row("2026-11-11", "weight_kg", "withings", 84),
        ],
        DAY,
      ),
    ).toBeNull();
  });

  it("T-5: その日の体重が無ければ比較を出さない", () => {
    expect(
      findWeightChange([row("2026-11-18", "weight_kg", "withings", 82.7)], DAY),
    ).toBeNull();
  });

  it("T-5: 比べる両方の日で、出所の優先順位で選んだ値を使う", () => {
    expect(
      findWeightChange(
        [
          row(DAY, "weight_kg", "withings", 82.4),
          row(DAY, "weight_kg", "manual", 90),
          row("2026-11-18", "weight_kg", "manual", 80),
          row("2026-11-18", "weight_kg", "apple_health", 82.5),
        ],
        DAY,
      ),
    ).toEqual({
      diffKg: -0.1,
      comparedDate: "2026-11-18",
      isPreviousDay: true,
    });
  });

  it("T-5: 引き算の誤差を残さない（小数第2位まで）", () => {
    expect(
      findWeightChange(
        [
          row(DAY, "weight_kg", "withings", 82.45),
          row("2026-11-18", "weight_kg", "withings", 82.7),
        ],
        DAY,
      )?.diffKg,
    ).toBe(-0.25);
  });

  it("T-5: 月をまたいでも前日を見つける", () => {
    expect(
      findWeightChange(
        [
          row("2026-12-01", "weight_kg", "withings", 81),
          row("2026-11-30", "weight_kg", "withings", 81.2),
        ],
        "2026-12-01",
      ),
    ).toEqual({
      diffKg: -0.2,
      comparedDate: "2026-11-30",
      isPreviousDay: true,
    });
  });
});

describe("buildDailyHealth", () => {
  it("T-5: 4項目をその日の値で埋め、行の無い項目は null", () => {
    expect(
      buildDailyHealth(
        [
          row(DAY, "weight_kg", "withings", 82.4),
          row("2026-11-18", "weight_kg", "withings", 82.7),
          row(DAY, "steps", "apple_health", 0),
          row("2026-11-18", "body_fat_pct", "withings", 21.3),
        ],
        DAY,
      ),
    ).toEqual({
      weightKg: 82.4,
      weightChange: {
        diffKg: -0.3,
        comparedDate: "2026-11-18",
        isPreviousDay: true,
      },
      bodyFatPct: null,
      steps: 0,
      activeEnergyKcal: null,
    });
  });

  it("T-5: 行が1つも無い日はすべて null", () => {
    expect(buildDailyHealth([], DAY)).toEqual({
      weightKg: null,
      weightChange: null,
      bodyFatPct: null,
      steps: null,
      activeEnergyKcal: null,
    });
  });
});

describe("toHealthValueRows", () => {
  it("T-5: 知っている項目と出所の行だけを残す", () => {
    expect(
      toHealthValueRows([
        { date: DAY, metric: "weight_kg", source: "withings", value: 82.4 },
        { date: DAY, metric: "sleep_min", source: "withings", value: 400 },
        { date: DAY, metric: "steps", source: "fitbit", value: 9000 },
      ]),
    ).toEqual([row(DAY, "weight_kg", "withings", 82.4)]);
  });
});

describe("表示の整形", () => {
  it("T-5: 前日と比べたときは「前日比」、前の日と比べたときは「前回比（M/D）」", () => {
    expect(
      formatWeightChange({
        diffKg: -0.3,
        comparedDate: "2026-11-18",
        isPreviousDay: true,
      }),
    ).toBe("前日比 −0.3");
    expect(
      formatWeightChange({
        diffKg: 0.3,
        comparedDate: "2026-11-17",
        isPreviousDay: false,
      }),
    ).toBe("前回比（11/17） +0.3");
  });

  it("T-5: 歩数は桁区切りで、0 歩は 0", () => {
    expect(formatSteps(8214)).toBe("8,214");
    expect(formatSteps(0)).toBe("0");
  });
});
