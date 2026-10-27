// This week has no ?week=, so the plain /plan stays the default URL
export const planHref = (weekStart: string, thisMonday: string): string =>
  weekStart === thisMonday ? "/plan" : `/plan?week=${weekStart}`;
