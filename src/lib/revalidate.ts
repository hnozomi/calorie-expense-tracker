"use server";

import { revalidatePath } from "next/cache";

/** Re-read every screen after a change: screens prefetched earlier would otherwise keep the old data */
export const revalidateApp = async (): Promise<void> => {
  revalidatePath("/", "layout");
};
