/** The home screen URL for a day. Today has no ?date= so the plain /home stays the default */
export const homeHref = (date: string, today: string): string =>
  date === today ? "/home" : `/home?date=${date}`;
