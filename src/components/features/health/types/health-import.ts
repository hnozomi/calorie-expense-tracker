/** The sources the import fills; manual values are typed in the app, not imported */
export const IMPORTED_HEALTH_SOURCES = ["withings", "apple_health"] as const;
export type ImportedHealthSource = (typeof IMPORTED_HEALTH_SOURCES)[number];

/** When a source last sent values, and the latest day it sent. null when it never sent any */
export type HealthImportSourceStatus = {
  source: ImportedHealthSource;
  lastImportedAt: string | null;
  latestDate: string | null;
};

/** An import token as the settings screen shows it. The hash is never read; the plain token is shown only once */
export type ImportTokenSummary = {
  id: string;
  label: string;
  tokenPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

/** A token revoked on the screen before the server confirms it */
export type ImportTokenRevoke = {
  id: string;
  revokedAt: string;
};
