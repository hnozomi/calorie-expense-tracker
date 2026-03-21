/** TanStack Query key factory for all domains */
export const queryKeys = {
  meals: {
    all: ["meals"] as const,
    daily: (date: string) => ["meals", "daily", date] as const,
    summary: (date: string) => ["meals", "summary", date] as const,
  },
  recipes: {
    all: ["recipes"] as const,
    list: (search?: string) => ["recipes", "list", search] as const,
    detail: (id: string) => ["recipes", "detail", id] as const,
  },
  foodMasters: {
    all: ["food-masters"] as const,
    list: (search?: string) => ["food-masters", "list", search] as const,
    detail: (id: string) => ["food-masters", "detail", id] as const,
  },
  setMenus: {
    all: ["set-menus"] as const,
    list: () => ["set-menus", "list"] as const,
    detail: (id: string) => ["set-menus", "detail", id] as const,
  },
  plans: {
    all: ["plans"] as const,
    weekly: (weekStart: string) => ["plans", "weekly", weekStart] as const,
    untransferred: (date: string) => ["plans", "untransferred", date] as const,
  },
  report: {
    weekly: (weekStart: string) => ["report", "weekly", weekStart] as const,
  },
} as const;
