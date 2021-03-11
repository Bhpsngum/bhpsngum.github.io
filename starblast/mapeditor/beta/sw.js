const cacheName = "MapEditor-v3.1.5_beta";
const SRCs = [...[...document.querySelectorAll("link")].map(i=>i.href),...[...document.querySelectorAll("script")].map(i=>i.src).filter(i => i)];
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(SRCs);
  })());
});
self.addEventListener('fetch', (e) => {
  e.respondWith((async () => {
    const r = await caches.match(e.request);
    if (r) return r;
    const response = await fetch(e.request);
    const cache = await caches.open(cacheName);
    cache.put(e.request, response.clone());
    return response;
  })());
});
