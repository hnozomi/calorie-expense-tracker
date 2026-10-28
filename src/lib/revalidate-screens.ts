import { revalidatePath } from "next/cache";

// Screens prefetched earlier would otherwise keep the old data, so a change re-reads all of them.
// Server Actions call this once their write succeeded (as the signed-in user, through RLS)
export const revalidateAllScreens = (): void => {
  revalidatePath("/", "layout");
};
