"use client";

import { useEffect } from "react";

/** Registers the Service Worker on mount */
const ServiceWorkerRegister = () => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  return null;
};

export { ServiceWorkerRegister };
