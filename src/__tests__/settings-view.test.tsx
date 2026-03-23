import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsView } from "@/components/features/settings/components/settings-view";

/** Mock child components to isolate SettingsView structure */
vi.mock(
  "@/components/features/settings/components/nutrition-target-section",
  () => ({
    NutritionTargetSection: () => (
      <div data-testid="nutrition-target-section">NutritionTarget</div>
    ),
  }),
);
vi.mock("@/components/features/settings/components/account-section", () => ({
  AccountSection: () => <div data-testid="account-section">Account</div>,
}));
vi.mock("@/components/features/settings/components/csv-export-section", () => ({
  CsvExportSection: () => <div data-testid="csv-export-section">CsvExport</div>,
}));
vi.mock("@/components/features/settings/components/app-info-section", () => ({
  AppInfoSection: () => <div data-testid="app-info-section">AppInfo</div>,
}));
vi.mock(
  "@/components/features/settings/components/danger-zone-section",
  () => ({
    DangerZoneSection: () => (
      <div data-testid="danger-zone-section">DangerZone</div>
    ),
  }),
);

afterEach(() => {
  cleanup();
});

describe("SettingsView", () => {
  it("renders the header with title '設定'", () => {
    render(<SettingsView />);
    expect(screen.getByText("設定")).toBeInTheDocument();
  });

  it("renders the account section", () => {
    render(<SettingsView />);
    expect(screen.getByTestId("account-section")).toBeInTheDocument();
  });

  it("renders the CSV export section", () => {
    render(<SettingsView />);
    expect(screen.getByTestId("csv-export-section")).toBeInTheDocument();
  });

  it("renders the app info section", () => {
    render(<SettingsView />);
    expect(screen.getByTestId("app-info-section")).toBeInTheDocument();
  });

  it("renders the danger zone section", () => {
    render(<SettingsView />);
    expect(screen.getByTestId("danger-zone-section")).toBeInTheDocument();
  });
});
