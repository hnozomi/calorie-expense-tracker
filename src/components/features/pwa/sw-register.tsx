"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/** Prompt the user to apply a waiting Service Worker update */
const promptUpdate = (waitingWorker: ServiceWorker) => {
  toast("新しいバージョンがあります", {
    description: "更新すると最新の状態になります",
    duration: Number.POSITIVE_INFINITY,
    action: {
      label: "更新",
      onClick: () => waitingWorker.postMessage({ type: "SKIP_WAITING" }),
    },
  });
};

/** Registers the Service Worker and handles the update-available flow */
const ServiceWorkerRegister = () => {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let hasReloaded = false;

    /** Reload once when the approved update takes control */
    const handleControllerChange = () => {
      if (hasReloaded) return;
      hasReloaded = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // An update may already be waiting from a previous visit
        if (registration.waiting && navigator.serviceWorker.controller) {
          promptUpdate(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          installingWorker.addEventListener("statechange", () => {
            // "installed" with an active controller means a new version is waiting
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              promptUpdate(installingWorker);
            }
          });
        });
      })
      .catch(console.error);

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
    };
  }, []);

  return null;
};

export { ServiceWorkerRegister };
