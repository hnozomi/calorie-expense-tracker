// Today has no ?date=, so the plain /home stays the default URL
export const homeHref = (date: string, today: string): string =>
  date === today ? "/home" : `/home?date=${date}`;
