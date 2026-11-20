// How long the browser keeps a screen's data. Five minutes puts it in the route's App Shell, so switching tabs never waits
// (under 30 seconds even per-link prefetch stops working). Every save in the app re-reads with revalidateAllScreens.
// Health values also come from outside (POST /api/import/health-daily). The import calls revalidateAllScreens too,
// but that cannot reach the private cache in a browser, so a screen already open shows them up to 5 minutes later
// (or on a reload or a move to another day). That delay was accepted for the health import (phase 1 design, U-6)
export const SCREEN_CACHE = { stale: 300 };
