import { createWeekStartAtom } from "@/lib/create-week-start-atom";

/** Currently selected week start date for the plan calendar (defaults to this Monday) */
export const planWeekStartAtom = createWeekStartAtom();
