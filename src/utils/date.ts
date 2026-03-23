/** Format a Date to YYYY-MM-DD string */
export const formatDateToString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/** Get today's date in local timezone as YYYY-MM-DD */
export const getTodayString = (): string => formatDateToString(new Date());

/** Validate a YYYY-MM-DD string and ensure it round-trips as a real calendar date */
export const isValidDateString = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return formatDateToString(new Date(`${value}T00:00:00`)) === value;
};

/** Shift a YYYY-MM-DD date string by a given number of days */
export const shiftDate = (dateStr: string, days: number): string => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return formatDateToString(d);
};

/** Get Monday of the current week as YYYY-MM-DD */
export const getThisMonday = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return formatDateToString(monday);
};

/** Format a YYYY-MM-DD string for compact Japanese display */
export const formatDisplayDate = (dateStr: string): string => {
  const date = new Date(`${dateStr}T00:00:00`);
  return `${date.getMonth() + 1}/${date.getDate()}（${"日月火水木金土"[date.getDay()]}）`;
};

/** Format a week range label like 3/23 - 3/29 */
export const formatWeekLabel = (weekStart: string): string => {
  const weekEnd = shiftDate(weekStart, 6);
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(`${weekEnd}T00:00:00`);
  return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
};

export type WeekDay = {
  date: string;
  label: string;
  dayOfWeek: string;
};

/** Build 7 day labels starting from the given week start */
export const buildWeekDays = (weekStart: string): WeekDay[] => {
  const days: WeekDay[] = [];
  const weekDays = "日月火水木金土";

  for (let i = 0; i < 7; i++) {
    const date = shiftDate(weekStart, i);
    const current = new Date(`${date}T00:00:00`);
    days.push({
      date,
      label: `${current.getMonth() + 1}/${current.getDate()}`,
      dayOfWeek: weekDays[current.getDay()],
    });
  }

  return days;
};
