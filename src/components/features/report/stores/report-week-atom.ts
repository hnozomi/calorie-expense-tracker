import { createWeekStartAtom } from "@/lib/create-week-start-atom";

/** Currently selected week start date for the weekly report (defaults to this Monday) */
export const reportWeekStartAtom = createWeekStartAtom();
