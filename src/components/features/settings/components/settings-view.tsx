"use client";

import { Header, PageContainer } from "@/components/features/layout";
import { AccountSection } from "./account-section";
import { AppInfoSection } from "./app-info-section";
import { CsvExportSection } from "./csv-export-section";
import { DangerZoneSection } from "./danger-zone-section";
import { NutritionTargetSection } from "./nutrition-target-section";

/** Main view for the settings screen (S-10) */
const SettingsView = () => {
  return (
    <>
      <Header title="設定" />
      <PageContainer>
        <div className="space-y-6 p-4">
          <NutritionTargetSection />
          <AccountSection />
          <CsvExportSection />
          <AppInfoSection />
          <DangerZoneSection />
        </div>
      </PageContainer>
    </>
  );
};

export { SettingsView };
