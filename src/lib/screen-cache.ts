// How long the browser keeps a screen's data. Five minutes puts it in the route's App Shell, so switching tabs never waits
// (under 30 seconds even per-link prefetch stops working). Data only changes inside this app, and every save re-reads with revalidateApp
export const SCREEN_CACHE = { stale: 300 };
