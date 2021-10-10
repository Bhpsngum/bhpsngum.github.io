var imports = [
  "/starblast/mapeditor/",
  "/starblast/mapeditor/index.html",
  "/starblast/mapeditor/icon_dark.png",
  "/starblast/mapeditor/icon_light.png",
  "/starblast/mapeditor/Asteroid.png",
  "/starblast/mapeditor/style.css",
  "/starblast/mapeditor/mapeditor.json",
  "/serviceWorker.js",
  "https://cdn.jsdelivr.net/gh/jquery/jquery/dist/jquery.min.js",
  "https://cdn.jsdelivr.net/gh/marcj/css-element-queries/src/ResizeSensor.min.js",
  "https://cdn.jsdelivr.net/gh/pieroxy/lz-string/libs/lz-string.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/ace.js",
  "https://kit.fontawesome.com/ccd821e6cb.js",
  "https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/mode-javascript.js",
  "https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/theme-monokai.js",
  "https://cdn.jsdelivr.net/gh/tombigel/detect-zoom/detect-zoom.min.js",
  "/starblast/mapeditor/script.js",
  "/starblast/mapeditor/presets.js",
  "/starblast/mapeditor/MapCreatorbyID.js",
  "/starblast/mapeditor/RandomMaze.js"
];

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
    try {
      const response = await fetch(e.request);
      if (response.ok) {
        if ((e.request||{}).method == 'GET') try {
          const cache = await caches.open(cacheName);
          cache.put(e.request, response.clone());
        }
        catch(e){}
      }
      else {
        const r = await caches.match(e.request);
        if (r) return r;
      }
      return response
    }
    catch (e) { return e }
  })());
});
