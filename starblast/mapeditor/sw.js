self.importScripts('imports.js');
const cacheName = "MapEditorCaches";
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    imports.forEach(function (imp) {
      let res = fetch(imp);
      res.ok && cache.put(imp,res);
    });
  })());
});
self.addEventListener('fetch', (e) => {
  e.respondWith((async () => {
    const response = await fetch(e.request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(e.request, response.clone());
    }
    else {
      const r = await caches.match(e.request);
      if (r) return r;
    }
    return response
  })());
});
