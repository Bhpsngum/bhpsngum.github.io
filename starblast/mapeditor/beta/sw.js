const cacheName = "MapEditor-v3.1.5_beta";
const MapImages = [
  "/starblast/mapeditor/icon_light.png",
  "/starblast/mapeditor/icon_dark.png",
  "/starblast/mapeditor/Asteroid.png"
];
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(MapImages);
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
