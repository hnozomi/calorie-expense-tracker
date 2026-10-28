import {
  getAccountEmail,
  getNutritionTarget,
} from "@/components/features/settings/api/queries";
import { AccountSection } from "./account-section";
import { AppInfoSection } from "./app-info-section";
import { CsvExportSection } from "./csv-export-section";
import { DangerZoneSection } from "./danger-zone-section";
import { NutritionTargetSection } from "./nutrition-target-section";
import { ThemeSection } from "./theme-section";

export const SettingsContent = async () => {
  const [target, email] = await Promise.all([
    getNutritionTarget(),
    getAccountEmail(),
  ]);

  return (
    <div className="space-y-6 p-4">
      <NutritionTargetSection target={target} />
      <ThemeSection />
      <AccountSection email={email} />
      <CsvExportSection />
      <AppInfoSection />
      <DangerZoneSection />
    </div>
  );
};
