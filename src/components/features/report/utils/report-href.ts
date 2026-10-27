// This week has no ?week=, so the plain /other/report stays the default URL
export const reportHref = (weekStart: string, thisMonday: string): string =>
  weekStart === thisMonday
    ? "/other/report"
    : `/other/report?week=${weekStart}`;
