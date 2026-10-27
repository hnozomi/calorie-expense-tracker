import { cacheLife } from "next/cache";
import { getTodayInTokyo } from "@/utils";
import { SCREEN_CACHE } from "./screen-cache";

// Reading the clock is per request, so it lives in a private cache function: that keeps it out of the
// prerendered shell but still inside link prefetches. Kept as long as the screen data, so near midnight
// "today" can lag by up to that time
/** Today in Asia/Tokyo for the current request (YYYY-MM-DD) */
export const getToday = async (): Promise<string> => {
  "use cache: private";
  cacheLife(SCREEN_CACHE);
  return getTodayInTokyo();
};
