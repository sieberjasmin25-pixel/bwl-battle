/* Service Worker – nur für Push-Benachrichtigungen (kein Offline-Cache, damit Updates sofort ankommen).
   Nachrichten kommen über Firebase Cloud Messaging (verschickt von tools/push/send.mjs) mit
   data: {title, body, url}. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", event => {
  let p = {};
  try { p = event.data ? event.data.json() : {}; } catch (e) { p = { data: { body: event.data && event.data.text() } }; }
  const d = Object.assign({}, p.notification || {}, p.data || {});
  const title = d.title || "Gallisches Dorfduell";
  event.waitUntil(self.registration.showNotification(title, {
    body: d.body || "",
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    tag: d.tag || undefined,
    data: { url: d.url || "./" }
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "./", self.registration.scope).href;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) {
      if (c.url.startsWith(self.registration.scope) && "navigate" in c) { await c.navigate(url); return c.focus(); }
    }
    return self.clients.openWindow(url);
  })());
});
