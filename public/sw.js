const CACHE_VERSION = "meshilog-v1";
const STATIC_ASSETS = ["/", "/home", "/plan", "/recipes", "/other"];

/** Install: pre-cache static assets */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
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

/** Fetch: Network First for API, Cache First for static assets */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip Supabase API requests (auth, real-time)
  if (url.hostname.includes("supabase.co")) return;

  // Network First for navigation and API
  if (event.request.mode === "navigate" || url.pathname.startsWith("/rest/")) {
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
            .then((cached) => cached || caches.match("/")),
        ),
    );
    return;
  }

  // Cache First for static assets (JS, CSS, images, fonts)
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
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
