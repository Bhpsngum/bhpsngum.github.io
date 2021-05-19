self.importScripts('imports.js');
const cacheName = "MapEditorCaches";
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(imports);
  })());
});
self.addEventListener('fetch', (e) => {
  e.respondWith((async () => {
    const response = await fetch(e.request);
    if (status.ok) {
      const cache = await caches.open(cacheName);
      cache.put(e.request, response.clone());
      return response;
    }
    else {
      const r = await caches.match(e.request);
      if (r) return r;
    }
  })());
});
