var imports = [
  "/starblast/sscv/",
  "/starblast/sscv/index.html",
  "/starblast/sscv/icon.png",
  "/starblast/sscv/style.css",
  "/starblast/sscv/sscv.json",
  "/serviceWorker.js",
  "https://cdn.jsdelivr.net/gh/jquery/jquery/dist/jquery.min.js",
  "https://cdn.rawgit.com/js2coffee/js2coffee/v2.1.0/dist/js2coffee.js",
  "/starblast/sscv/script.js"
];

const cacheName = "SSCVOffline";
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
      try {
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
  })());
});
