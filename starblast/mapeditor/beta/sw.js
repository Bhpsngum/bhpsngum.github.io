self.importScripts('imports.js');
const cacheName = "MapEditorCaches";
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(imports);
  })());
});
self.addEventListener('fetch', (e) => {
  e.request = e.request || {};
  e.respondWith((async () => {
    try{const r = await caches.match(e.request.url);
    if (r) return r;
    const response = await fetch(e.request.url);
    const cache = await caches.open(cacheName);
    cache.put(e.request.url, response.clone());
    return response;}catch(tgx){}
  })());
});
