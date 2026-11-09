/* Corral Hill PWA service worker: cache shell + last snapshot for offline. */
const CACHE = "ch-shell-v3";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./mock-snapshot.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // never cache ntfy live polls in the SW shell; network-first with cache fallback for our origin only
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(e.request).then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }
  // ntfy / other: network only (app caches snapshot in localStorage itself)
});
