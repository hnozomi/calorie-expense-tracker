const CACHE_VERSION = "meshilog-v3";
// Only public, non-redirecting pages are precached; auth-gated routes would
// cache the login redirect HTML under the wrong key
const STATIC_ASSETS = ["/offline", "/login"];

/** Install: pre-cache public assets, tolerating individual failures */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) =>
        Promise.allSettled(STATIC_ASSETS.map((asset) => cache.add(asset))),
      ),
  );
  // No skipWaiting() here: the new worker waits until the user approves the
  // update (SKIP_WAITING message), so a live tab never has assets swapped
  // out from under it
});

/** Activate: clean old caches */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

/** Message: apply a waiting update when the user approves it */
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/** Whether the request targets an immutable static asset safe for Cache First */
const isStaticAsset = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/icons/") ||
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/.test(url.pathname);

/** Fetch: Network First for navigations, Cache First for static assets only */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip cross-origin requests (Supabase API, auth, real-time)
  if (url.origin !== self.location.origin) return;

  // Skip RSC payload requests — the Next.js router manages its own cache,
  // and serving them Cache First would pin stale pages across deploys
  if (url.searchParams.has("_rsc") || event.request.headers.get("RSC")) return;

  // Network First for navigations, falling back to cache then /offline
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((cached) => cached || caches.match("/offline")),
        ),
    );
    return;
  }

  // Everything else (non-static requests) goes straight to the network
  if (!isStaticAsset(url)) return;

  // Cache First for immutable static assets (hashed JS/CSS, images, fonts)
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        }),
    ),
  );
});

/** Push notification */
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? "めしログ";
  const options = {
    body: data.body ?? "",
    icon: "/icons/icon-192x192.png",
    data: { url: data.url ?? "/home" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

/** Notification tap: focus an existing window or open the app */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/home";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find((client) => "focus" in client);
        if (existing) {
          existing.navigate(targetUrl);
          return existing.focus();
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});
