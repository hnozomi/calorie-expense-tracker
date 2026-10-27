import { Suspense } from "react";
import { Header, PageContainer } from "@/components/features/layout";
import {
  SettingsContent,
  SettingsSkeleton,
} from "@/components/features/settings";

/** S-10: Settings. The header shows at once; the targets and the account wait inside Suspense */
const SettingsPage = () => {
  return (
    <>
      <Header title="設定" />
      <PageContainer>
        <Suspense fallback={<SettingsSkeleton />}>
          <SettingsContent />
        </Suspense>
      </PageContainer>
    </>
  );
};

export default SettingsPage;
