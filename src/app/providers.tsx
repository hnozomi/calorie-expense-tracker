"use client";
// Client because the theme and Jotai providers hold browser-only state

import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "next-themes";

/** Wraps the app with the theme and Jotai providers */
const Providers = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
  >
    <JotaiProvider>{children}</JotaiProvider>
  </ThemeProvider>
);

export { Providers };
