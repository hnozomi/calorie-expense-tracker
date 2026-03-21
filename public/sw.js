self.addEventListener("install", (_event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? "Notification";
  const options = {
    body: data.body ?? "",
    icon: "/icons/icon-192x192.png",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
