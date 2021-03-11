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
