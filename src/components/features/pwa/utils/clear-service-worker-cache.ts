/** Ask the service worker to drop its cached pages (they contain the signed-in user's data) */
export const clearServiceWorkerCache = (): void => {
  navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_CACHE" });
};
