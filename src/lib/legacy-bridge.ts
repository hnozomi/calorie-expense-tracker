import { revalidateApp } from "@/lib/revalidate";

// Only while the screens move to server-side reads: a change made on a screen that still writes through
// TanStack Query must also refresh the screens that already read on the server. Removed with TanStack Query
export const revalidateAfterLegacyMutation = (): void => {
  // The change itself is already saved; a failed refresh (offline, an old tab after a deploy) only leaves other screens stale
  revalidateApp().catch((error: unknown) => {
    console.error("Failed to refresh the screens after a change:", error);
  });
};
