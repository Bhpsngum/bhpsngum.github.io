self.importScripts('imports.js');
const cacheName = "MapEditor-v3.1.5_beta";
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(imports);
  })());
});
self.addEventListener('fetch', (e) => {
  e.respondWith((async () => {
    try{const r = await caches.match(e.request);
    if (r) return r;
    const response = await fetch(e.request);
    const cache = await caches.open(cacheName);
    cache.put(e.request, response.clone());
    return response;}catch(tgx){console.log(e)}
  })());
});
