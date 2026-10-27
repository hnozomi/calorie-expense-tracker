import { revalidatePath } from "next/cache";

// Screens prefetched earlier would otherwise keep the old data, so a change re-reads all of them.
// Server Actions call this directly once their write succeeded (as the signed-in user, through RLS), so they skip revalidateApp's own check
export const revalidateAllScreens = (): void => {
  revalidatePath("/", "layout");
};
