"use client";

import { Header, PageContainer } from "@/components/features/layout";
import { Separator } from "@/components/ui/separator";
import { AccountSection } from "./account-section";
import { AppInfoSection } from "./app-info-section";
import { CsvExportSection } from "./csv-export-section";
import { DangerZoneSection } from "./danger-zone-section";

/** Main view for the settings screen (S-10) */
const SettingsView = () => {
  return (
    <>
      <Header title="設定" />
      <PageContainer>
        <div className="space-y-6 p-4">
          <AccountSection />
          <Separator />
          <CsvExportSection />
          <Separator />
          <AppInfoSection />
          <Separator />
          <DangerZoneSection />
        </div>
      </PageContainer>
    </>
  );
};

export { SettingsView };
