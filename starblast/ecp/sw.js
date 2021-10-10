var imports = [
  "/starblast/ecp/",
  "/starblast/ecp/index.html",
  "/starblast/ecp/icon.png",
  "/starblast/ecp/style.css",
  "/starblast/ecp/ecp_pwa.json",
  "/serviceWorker.js",
  "https://cdn.jsdelivr.net/gh/jquery/jquery/dist/jquery.min.js",
  "https://kit.fontawesome.com/ccd821e6cb.js",,
  "https://starblast.data.neuronality.com/fonts/starblast-glyphs.ttf?v=1",
  "/starblast/ecp/script.js",
  "/starblast/ecp/customization.js"
];

const cacheName = "ECPOffline";
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
